#include <stdint.h>
#include <stdlib.h>
#include <stdbool.h>

#pragma pack(push, 1)
typedef struct {
  uint8_t bMax;
  uint8_t nullableMemsize;
  uint8_t keySelf;
  uint8_t refString;
  uint8_t refArray;
  // uint8_t arr_byte; same as `refArray` not false
  uint8_t arr_boolean;
  uint8_t arr_short;     // 2
  uint8_t arr_long;      // 4
  uint8_t arr_longLong;  // 8
  uint8_t arr_string;
  uint8_t arr_keyForeign;
  uint8_t arr_keySelf;
} app_stat;
#pragma pack(pop)

static const size_t DAT_MAGIC_BBBB_SIZE = 8;
static const uint64_t DAT_MAGIC_NULL = UINT64_C(0xfefefefefefefefe);
static const size_t DAT_DATA_MODEL_SIZE = 8;

static inline bool dat_is_null(uint64_t value);
static inline uint64_t dat_read_sizet(uint8_t* data);
static inline bool dat_is_valid_varoffset(uint64_t offset, size_t dataVariable_len);
static bool dat_is_string_at(uint8_t* start, uint8_t* end);

void app_analyze_dat(
  uint8_t* dataFixed, size_t dataFixed_len,
  uint8_t* dataVariable, size_t dataVariable_len,
  size_t row_len,
  app_stat* stats
) {
  for (size_t bi = 0; bi < row_len; ++bi) {
    stats[bi].bMax = 0x00;
    stats[bi].nullableMemsize = false;
    stats[bi].keySelf = ((row_len - bi) >= DAT_DATA_MODEL_SIZE);
    stats[bi].refString = ((row_len - bi) >= DAT_DATA_MODEL_SIZE);
    stats[bi].refArray = ((row_len - bi) >= DAT_DATA_MODEL_SIZE * 2);
    stats[bi].arr_boolean = true;
    stats[bi].arr_short = true;
    stats[bi].arr_long = true;
    stats[bi].arr_longLong = true;
    stats[bi].arr_string = true;
    stats[bi].arr_keyForeign = true;
    stats[bi].arr_keySelf = true;
  }

  if (row_len == 0) return;
  size_t row_count = dataFixed_len / row_len;

  for (size_t ri = 0; ri < row_count; ++ri) {
    size_t row = ri * row_len;

    for (size_t bi = 0; bi < row_len; ++bi) {
      app_stat* stat = stats + bi;

      uint8_t byte = dataFixed[row + bi];
      if (byte > stat->bMax) {
        stat->bMax = byte;
      }

      if (byte == 0xfe && !stat->nullableMemsize && ((row_len - bi) >= DAT_DATA_MODEL_SIZE)) {
        stat->nullableMemsize = dat_is_null(
          dat_read_sizet(dataFixed + (row + bi)));
      }

      if (stat->refString) {
        uint64_t varOffset = dat_read_sizet(dataFixed + (row + bi));
        stat->refString = dat_is_valid_varoffset(varOffset, dataVariable_len) &&
          dat_is_string_at(dataVariable + varOffset, dataVariable + dataVariable_len);
      }

      if (stat->keySelf) {
        uint64_t rowIdx = dat_read_sizet(dataFixed + (row + bi));
        if (!dat_is_null(rowIdx)) {
          stat->keySelf = (rowIdx < row_count);
        }
      }

      if (stat->refArray) {
        uint64_t arrayLength = dat_read_sizet(dataFixed + (row + bi));
        uint64_t varOffset = dat_read_sizet(dataFixed + (row + bi) + DAT_DATA_MODEL_SIZE);
        if (
          !dat_is_valid_varoffset(varOffset, dataVariable_len) ||
          !dat_is_valid_varoffset(varOffset + (1 * arrayLength), dataVariable_len)
        ) {
          if (!(arrayLength == 0 && varOffset == dataVariable_len)) {
            stat->refArray = false;
          }
        } else {
          if (stat->arr_short) stat->arr_short =
            dat_is_valid_varoffset(varOffset + (2 * arrayLength), dataVariable_len);
          if (stat->arr_long) stat->arr_long =
            dat_is_valid_varoffset(varOffset + (4 * arrayLength), dataVariable_len);
          if (stat->arr_longLong) stat->arr_longLong =
            dat_is_valid_varoffset(varOffset + (8 * arrayLength), dataVariable_len);
          if (stat->arr_string) stat->arr_string =
            dat_is_valid_varoffset(varOffset + (DAT_DATA_MODEL_SIZE * arrayLength), dataVariable_len);
          if (stat->arr_keySelf) stat->arr_keySelf =
            dat_is_valid_varoffset(varOffset + (DAT_DATA_MODEL_SIZE * arrayLength), dataVariable_len);
          if (stat->arr_keyForeign) stat->arr_keyForeign =
            dat_is_valid_varoffset(varOffset + ((DAT_DATA_MODEL_SIZE * 2) * arrayLength), dataVariable_len);

          for (size_t idx = 0; idx < arrayLength && stat->arr_string; ++idx) {
            uint64_t strOffset = dat_read_sizet(dataVariable + varOffset + (DAT_DATA_MODEL_SIZE * idx));
            stat->arr_string = dat_is_valid_varoffset(strOffset, dataVariable_len) &&
              dat_is_string_at(dataVariable + strOffset, dataVariable + dataVariable_len);
          }

          for (size_t idx = 0; idx < arrayLength && stat->arr_keySelf; ++idx) {
            uint64_t rowIdx = dat_read_sizet(dataVariable + varOffset + (DAT_DATA_MODEL_SIZE * idx));
            if (!dat_is_null(rowIdx)) {
              stat->arr_keySelf = (rowIdx < row_count);
            }
          }

          for (size_t idx = 0; idx < arrayLength && stat->arr_boolean; ++idx) {
            stat->arr_boolean =
              dataVariable[varOffset + idx] <= 0x01;
          }
        }
      }
    }
  }
}

static inline bool dat_is_null(uint64_t value) {
  return value == DAT_MAGIC_NULL;
}

static inline uint64_t dat_read_sizet(uint8_t* data) {
  return *(uint64_t*)data;
}

static inline bool dat_is_valid_varoffset(uint64_t offset, size_t dataVariable_len) {
  return offset < dataVariable_len && offset >= DAT_MAGIC_BBBB_SIZE;
}

static bool dat_is_string_at(uint8_t* start, uint8_t* end) {
  for (;;) {
    if ((start + 3) >= end) {
      return false;
    }
    uint16_t c1 = *(uint16_t*)(start);
    uint16_t c2 = *(uint16_t*)(start + 2);
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
