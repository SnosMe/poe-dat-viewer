#include <cstdint>
#include <cstdlib>
#include <cstring>

#pragma pack(push, 1)
struct DatAnalyzedColumn {
  /*  0 */ uint8_t maxValue;
  /*  1 */ uint8_t nullableMemsize;
  /*  2 */ uint8_t value_keySelf;
  /*  3 */ uint8_t value_keyForeign;
  /*  4 */ uint8_t value_refString;
  /*  5 */ uint8_t array_boolean;
  /*  6 */ uint8_t array_element8;
  /*  -    uint8_t array_element16; */
  /*  7 */ uint8_t array_element32;
  /*  -    uint8_t array_element64; */
  /*  8 */ uint8_t array_refString;
  /*  9 */ uint8_t array_keyForeign;
  /* 10 */ uint8_t array_keySelf;
};
#pragma pack(pop)

template<class SizeT>
static void analyzeDat(
  uint8_t* dataFixed, size_t dataFixed_len,
  uint8_t* dataVariable, size_t dataVariable_len,
  size_t rowLength,
  DatAnalyzedColumn* stats
);

extern "C" {

void fast_analyze_dat32(
  uint8_t* a1, size_t a2,
  uint8_t* a3, size_t a4,
  size_t a5, DatAnalyzedColumn* a6
) {
  analyzeDat<uint32_t>(a1, a2, a3, a4, a5, a6);
}
void fast_analyze_dat64(
  uint8_t* a1, size_t a2,
  uint8_t* a3, size_t a4,
  size_t a5, DatAnalyzedColumn* a6
) {
  analyzeDat<uint64_t>(a1, a2, a3, a4, a5, a6);
}

}

template<class SizeT>
static inline SizeT read_unaligned(const uint8_t* data) {
  SizeT out;
  memcpy(&out, data, sizeof(SizeT));
  return out;
}

template<class SizeT>
static inline bool isValidVaroffset(SizeT offset, SizeT len, SizeT dataVariable_len, SizeT arrN = 1) {
  SizeT kMagicBbbbSize = 8;

  SizeT totalLen = len * arrN;
  if (arrN != 0) {
    if (totalLen / arrN != len) return false;
  }

  SizeT totalEnd = offset + totalLen;
  if (totalEnd < offset) return false;

  return offset >= kMagicBbbbSize && totalEnd <= dataVariable_len;
}

static bool isUtf16StringAt(uint8_t* start, uint8_t* end);

template<class SizeT>
static void analyzeDat(
  uint8_t* dataFixed, size_t dataFixed_len,
  uint8_t* dataVariable, size_t dataVariable_len,
  size_t rowLength,
  DatAnalyzedColumn* stats
) {
  SizeT kPtrSize = sizeof(SizeT);
  SizeT kPtrSize_2 = sizeof(SizeT) * 2;
  SizeT kNull = (sizeof(SizeT) == 4) ? 0xFEFEFEFE : 0xFEFEFEFEFEFEFEFE;
  SizeT kZero = (sizeof(SizeT) == 4) ? 0x00000000 : 0x0000000000000000;
  uint8_t kNullStart = 0xFE;
  SizeT kStrTerminatorSize = 4;

  for (size_t bi = 0; bi < rowLength; ++bi) {
    stats[bi].maxValue = 0x00;
    stats[bi].nullableMemsize = false;
    stats[bi].value_keySelf = ((rowLength - bi) >= kPtrSize);
    stats[bi].value_keyForeign = ((rowLength - bi) >= kPtrSize_2);
    stats[bi].value_refString = ((rowLength - bi) >= kPtrSize);
    stats[bi].array_element8 = ((rowLength - bi) >= kPtrSize_2);
    stats[bi].array_boolean = true;
    // stats[bi].array_element16 = true;
    stats[bi].array_element32 = true;
    // stats[bi].array_element64 = true;
    stats[bi].array_refString = true;
    stats[bi].array_keyForeign = true;
    stats[bi].array_keySelf = true;
  }

  if (rowLength == 0) return;
  size_t rowCount = dataFixed_len / rowLength;

  for (size_t ri = 0; ri < rowCount; ++ri) {
    size_t row = ri * rowLength;

    for (size_t bi = 0; bi < rowLength; ++bi) {
      DatAnalyzedColumn* stat = stats + bi;

      uint8_t byte = dataFixed[row + bi];
      if (byte > stat->maxValue) {
        stat->maxValue = byte;
      }

      if (byte == kNullStart && !stat->nullableMemsize && ((rowLength - bi) >= kPtrSize)) {
        stat->nullableMemsize = (kNull == read_unaligned<SizeT>(dataFixed + (row + bi)));
      }

      if (stat->value_refString) {
        SizeT varOffset = read_unaligned<SizeT>(dataFixed + (row + bi));
        stat->value_refString = isValidVaroffset<SizeT>(varOffset, kStrTerminatorSize, dataVariable_len) &&
          isUtf16StringAt(dataVariable + varOffset, dataVariable + dataVariable_len);
      }

      if (stat->value_keySelf) {
        SizeT rowIdx = read_unaligned<SizeT>(dataFixed + (row + bi));
        if (rowIdx != kNull) {
          stat->value_keySelf = (rowIdx < rowCount);
        }
      }

      if (stat->value_keyForeign) {
        SizeT rowIdx = read_unaligned<SizeT>(dataFixed + (row + bi));
        SizeT tablePtr = read_unaligned<SizeT>(dataFixed + (row + bi) + kPtrSize);
        if (rowIdx != kNull) {
          stat->value_keyForeign = (tablePtr == kZero);
        } else {
          stat->value_keyForeign = (tablePtr == kNull);
        }
      }

      if (stat->array_element8) {
        SizeT arrayLength = read_unaligned<SizeT>(dataFixed + (row + bi));
        SizeT varOffset = read_unaligned<SizeT>(dataFixed + (row + bi) + kPtrSize);
        if (
          !isValidVaroffset<SizeT>(varOffset, 0, dataVariable_len) ||
          !isValidVaroffset<SizeT>(varOffset, 1, dataVariable_len, arrayLength)
        ) {
          if (!(arrayLength == 0 && varOffset == dataVariable_len)) {
            stat->array_element8 = false;
          }
        } else {
          // if (stat->array_element16) stat->array_element16 =
          //   isValidVaroffset<SizeT>(varOffset, 2, dataVariable_len, arrayLength);
          if (stat->array_element32) stat->array_element32 =
            isValidVaroffset<SizeT>(varOffset, 4, dataVariable_len, arrayLength);
          // if (stat->array_element64) stat->array_element64 =
          //   isValidVaroffset<SizeT>(varOffset, 8, dataVariable_len, arrayLength);
          if (stat->array_refString) stat->array_refString =
            isValidVaroffset<SizeT>(varOffset, kPtrSize, dataVariable_len, arrayLength);
          if (stat->array_keySelf) stat->array_keySelf =
            isValidVaroffset<SizeT>(varOffset, kPtrSize, dataVariable_len, arrayLength);
          if (stat->array_keyForeign) stat->array_keyForeign =
            isValidVaroffset<SizeT>(varOffset, kPtrSize_2, dataVariable_len, arrayLength);

          for (size_t idx = 0; idx < arrayLength && stat->array_refString; ++idx) {
            SizeT strOffset = read_unaligned<SizeT>(dataVariable + varOffset + (kPtrSize * idx));
            stat->array_refString = isValidVaroffset<SizeT>(strOffset, kStrTerminatorSize, dataVariable_len) &&
              isUtf16StringAt(dataVariable + strOffset, dataVariable + dataVariable_len);
          }

          for (size_t idx = 0; idx < arrayLength && stat->array_keySelf; ++idx) {
            SizeT rowIdx = read_unaligned<SizeT>(dataVariable + varOffset + (kPtrSize * idx));
            if (rowIdx != kNull) {
              stat->array_keySelf = (rowIdx < rowCount);
            }
          }

          for (size_t idx = 0; idx < arrayLength && stat->array_keyForeign; ++idx) {
            SizeT rowIdx = read_unaligned<SizeT>(dataVariable + varOffset + (kPtrSize_2 * idx));
            SizeT tablePtr = read_unaligned<SizeT>(dataVariable + varOffset + (kPtrSize_2 * idx) + kPtrSize);
            if (rowIdx != kNull) {
              stat->array_keyForeign = (tablePtr == kZero);
            } else {
              stat->array_keyForeign = (tablePtr == kNull);
            }
          }

          for (size_t idx = 0; idx < arrayLength && stat->array_boolean; ++idx) {
            stat->array_boolean =
              dataVariable[varOffset + idx] <= 0x01;
          }
        }
      }
    }
  }
}

static bool isUtf16StringAt(uint8_t* start, uint8_t* end) {
  for (;;) {
    if ((start + 3) >= end) {
      return false;
    }
    uint16_t c1 = read_unaligned<uint16_t>(start);
    uint16_t c2 = read_unaligned<uint16_t>(start + 2);
    if (c1 == 0x0000 && c2 == 0x0000) {
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
    if (c1 > 0xD7FF && c1 < 0xE000) {
      if (c1 > 0xDBFF) {
        return false;
      }
      if (c2 < 0xDC00 || c2 > 0xDFFF) {
        return false;
      } else {
        start += 4;
      }
    } else {
      start += 2;
    }
  }
}
