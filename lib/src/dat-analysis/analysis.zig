const std = @import("std");
const readInt = std.mem.readIntLittle;

pub export fn malloc(size: usize) [*]u8 {
  const slice = std.heap.page_allocator.alloc(u8, size) catch unreachable;
  return slice.ptr;
}

pub export fn free(ptr: [*]u8, size: usize) void {
  std.heap.page_allocator.free(ptr[0..size]);
}

pub export fn fast_analyze_dat64(
  dataFixedPtr: [*]const u8, dataFixedLen: usize,
  dataVariablePtr: [*]const u8, dataVariableLen: usize,
  rowLen: usize, statsPtr: [*] DatAnalyzedColumn
) void {
  analyzeDat(u64, dataFixedPtr[0..dataFixedLen], dataVariablePtr[0..dataVariableLen], statsPtr[0..rowLen]);
}

const DatAnalyzedColumn = extern struct {
  maxValue: u8,             // 0
  nullableMemsize: bool,    // 1
  value_keySelf: bool,      // 2
  value_keyForeign: bool,   // 3
  value_refString: bool,    // 4
  array_boolean: bool,      // 5
  array_element8: bool,     // 6
  // array_element16: bool,
  array_element32: bool,    // 7
  // array_element64: bool,
  array_refString: bool,    // 8
  array_keyForeign: bool,   // 9
  array_keySelf: bool,      // 10
};

inline fn isValidVaroffset(comptime SizeT: type, offset: SizeT, len: SizeT, dataVariable_len: SizeT, arrN: SizeT) bool {
  const kMagicBbbbSize = 8;

  var totalLen = @mulWithOverflow(len, arrN);
  if (totalLen[1] != 0) return false;

  const totalEnd = @addWithOverflow(offset, totalLen[0]);
  if (totalEnd[1] != 0) return false;

  return offset >= kMagicBbbbSize and totalEnd[0] <= dataVariable_len;
}

fn analyzeDat(
  comptime SizeT: type,
  dataFixed: []const u8,
  dataVariable: []const u8,
  stats: []DatAnalyzedColumn
) void {
  const kPtrSize = @sizeOf(SizeT);
  const kPtrSize_2 = @sizeOf(SizeT) * 2;
  const kNull = if (@sizeOf(SizeT) == 4) 0xFEFEFEFE else 0xFEFEFEFEFEFEFEFE;
  const kZero = if (@sizeOf(SizeT) == 4) 0x00000000 else 0x0000000000000000;
  const kNullStart = 0xFE;
  const kStrTerminatorSize = 4;
  const rowLength = stats.len;

  for (stats) |*stat, bi| {
    stat.maxValue = 0x00;
    stat.nullableMemsize = false;
    stat.value_keySelf = ((rowLength - bi) >= kPtrSize);
    stat.value_keyForeign = ((rowLength - bi) >= kPtrSize_2);
    stat.value_refString = ((rowLength - bi) >= kPtrSize);
    stat.array_element8 = ((rowLength - bi) >= kPtrSize_2);
    stat.array_boolean = true;
    // stat.array_element16 = true;
    stat.array_element32 = true;
    // stat.array_element64 = true;
    stat.array_refString = true;
    stat.array_keyForeign = true;
    stat.array_keySelf = true;
  }

  if (rowLength == 0) return;
  const rowCount = dataFixed.len / rowLength;

  var ri: usize = 0;
  while (ri < rowCount) : (ri += 1) {
    const row = dataFixed[ri*rowLength .. (ri + 1)*rowLength];

    for (stats) |*stat, bi| {
      const byte = row[bi];
      if (byte > stat.maxValue) {
        stat.maxValue = byte;
      }

      if (byte == kNullStart and !stat.nullableMemsize and ((rowLength - bi) >= kPtrSize)) {
        stat.nullableMemsize = (kNull == readInt(SizeT, &row[bi]));
      }

      if (stat.value_refString) {
        const varOffset = readInt(SizeT, &row[bi]);
        stat.value_refString = isValidVaroffset(SizeT, varOffset, kStrTerminatorSize, dataVariable.len, 1) and
          isUtf16StringAt(dataVariable[@intCast(usize, varOffset)..]);
      }

      if (stat.value_keySelf) {
        const rowIdx = readInt(SizeT, &row[bi]);
        if (rowIdx != kNull) {
          stat.value_keySelf = (rowIdx < rowCount);
        }
      }

      if (stat.value_keyForeign) {
        const rowIdx = readInt(SizeT, &row[bi]);
        const tablePtr = readInt(SizeT, &row[bi + kPtrSize]);
        if (rowIdx != kNull) {
          stat.value_keyForeign = (tablePtr == kZero);
        } else {
          stat.value_keyForeign = (tablePtr == kNull);
        }
      }

      if (stat.array_element8) {
        const arrayLength = readInt(SizeT, &row[bi]);
        const varOffset = readInt(SizeT, &row[bi + kPtrSize]);
        if (
          !isValidVaroffset(SizeT, varOffset, 0, dataVariable.len, 1) or
          !isValidVaroffset(SizeT, varOffset, 1, dataVariable.len, arrayLength)
        ) {
          if (!(arrayLength == 0 and varOffset == dataVariable.len)) {
            stat.array_element8 = false;
          }
        } else {
          // if (stat.array_element16) stat.array_element16 =
          //   isValidVaroffset(SizeT, varOffset, 2, dataVariable.len, arrayLength);
          if (stat.array_element32) stat.array_element32 =
            isValidVaroffset(SizeT, varOffset, 4, dataVariable.len, arrayLength);
          // if (stat.array_element64) stat.array_element64 =
          //   isValidVaroffset(SizeT, varOffset, 8, dataVariable.len, arrayLength);
          if (stat.array_refString) stat.array_refString =
            isValidVaroffset(SizeT, varOffset, kPtrSize, dataVariable.len, arrayLength);
          if (stat.array_keySelf) stat.array_keySelf =
            isValidVaroffset(SizeT, varOffset, kPtrSize, dataVariable.len, arrayLength);
          if (stat.array_keyForeign) stat.array_keyForeign =
            isValidVaroffset(SizeT, varOffset, kPtrSize_2, dataVariable.len, arrayLength);

          var idx: usize = 0;
          while (idx < arrayLength and stat.array_refString) : (idx += 1) {
            const strOffset = readInt(SizeT, &dataVariable[@intCast(usize, varOffset) + (kPtrSize * idx)]);
            stat.array_refString = isValidVaroffset(SizeT, strOffset, kStrTerminatorSize, dataVariable.len, 1) and
              isUtf16StringAt(dataVariable[@intCast(usize, strOffset)..]);
          }

          idx = 0;
          while (idx < arrayLength and stat.array_keySelf) : (idx += 1) {
            const rowIdx = readInt(SizeT, &dataVariable[@intCast(usize, varOffset) + (kPtrSize * idx)]);
            if (rowIdx != kNull) {
              stat.array_keySelf = (rowIdx < rowCount);
            }
          }

          idx = 0;
          while (idx < arrayLength and stat.array_keyForeign) : (idx += 1) {
            const rowIdx = readInt(SizeT, &dataVariable[@intCast(usize, varOffset) + (kPtrSize_2 * idx)]);
            const tablePtr = readInt(SizeT, &dataVariable[@intCast(usize, varOffset) + (kPtrSize_2 * idx) + kPtrSize]);
            if (rowIdx != kNull) {
              stat.array_keyForeign = (tablePtr == kZero);
            } else {
              stat.array_keyForeign = (tablePtr == kNull);
            }
          }

          idx = 0;
          while (idx < arrayLength and stat.array_boolean) : (idx += 1) {
            stat.array_boolean =
              dataVariable[@intCast(usize, varOffset) + idx] <= 0x01;
          }
        }
      }
    }
  }
}

fn isUtf16StringAt(data: []const u8) bool {
  var bytes = data;
  while (true) {
    if (bytes.len < 4) {
      return false;
    }
    const c1 = readInt(u16, &bytes[0]);
    const c2 = readInt(u16, &bytes[2]);
    if (c1 == 0x0000 and c2 == 0x0000) {
      return true;
    }
    // + 0000 = 00000
    // + D7FF = 55295
    // h D800 = 55296
    // h DBFF = 56319
    // l DC00 = 56320
    // l DFFF = 57343
    // + E000 = 57344
    // + FFFF = 65535
    if (c1 > 0xD7FF and c1 < 0xE000) {
      if (c1 > 0xDBFF) {
        return false;
      }
      if (c2 < 0xDC00 or c2 > 0xDFFF) {
        return false;
      } else {
        bytes = bytes[4..];
      }
    } else {
      bytes = bytes[2..];
    }
  }
}
