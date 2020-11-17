#include "analysis.h"

static const uint32_t DAT_MAGIC_NULL = UINT32_C(0xfefefefe);
static const size_t DAT_DATA_MODEL_SIZE = 4;

static inline bool dat_is_null(uint32_t value);
static inline uint32_t dat_read_sizet(uint8_t* data);
static inline bool dat_is_valid_varoffset(uint32_t offset, uint32_t len, size_t dataVariable_len);

void app_analyze_dat32(
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
        uint32_t varOffset = dat_read_sizet(dataFixed + (row + bi));
        stat->refString = dat_is_valid_varoffset(varOffset, DAT_STR_TERMINATOR, dataVariable_len) &&
          dat_is_string_at(dataVariable + varOffset, dataVariable + dataVariable_len);
      }

      if (stat->keySelf) {
        uint32_t rowIdx = dat_read_sizet(dataFixed + (row + bi));
        if (!dat_is_null(rowIdx)) {
          stat->keySelf = (rowIdx < row_count);
        }
      }

      if (stat->refArray) {
        uint32_t arrayLength = dat_read_sizet(dataFixed + (row + bi));
        uint32_t varOffset = dat_read_sizet(dataFixed + (row + bi) + DAT_DATA_MODEL_SIZE);
        if (
          !dat_is_valid_varoffset(varOffset, 0, dataVariable_len) ||
          !dat_is_valid_varoffset(varOffset, (1 * arrayLength), dataVariable_len)
        ) {
          if (!(arrayLength == 0 && varOffset == dataVariable_len)) {
            stat->refArray = false;
          }
        } else {
          if (stat->arr_short) stat->arr_short =
            dat_is_valid_varoffset(varOffset, (2 * arrayLength), dataVariable_len);
          if (stat->arr_long) stat->arr_long =
            dat_is_valid_varoffset(varOffset, (4 * arrayLength), dataVariable_len);
          if (stat->arr_longLong) stat->arr_longLong =
            dat_is_valid_varoffset(varOffset, (8 * arrayLength), dataVariable_len);
          if (stat->arr_string) stat->arr_string =
            dat_is_valid_varoffset(varOffset, (DAT_DATA_MODEL_SIZE * arrayLength), dataVariable_len);
          if (stat->arr_keySelf) stat->arr_keySelf =
            dat_is_valid_varoffset(varOffset, (DAT_DATA_MODEL_SIZE * arrayLength), dataVariable_len);
          if (stat->arr_keyForeign) stat->arr_keyForeign =
            dat_is_valid_varoffset(varOffset, ((DAT_DATA_MODEL_SIZE * 2) * arrayLength), dataVariable_len);

          for (size_t idx = 0; idx < arrayLength && stat->arr_string; ++idx) {
            uint32_t strOffset = dat_read_sizet(dataVariable + varOffset + (DAT_DATA_MODEL_SIZE * idx));
            stat->arr_string = dat_is_valid_varoffset(strOffset, DAT_STR_TERMINATOR, dataVariable_len) &&
              dat_is_string_at(dataVariable + strOffset, dataVariable + dataVariable_len);
          }

          for (size_t idx = 0; idx < arrayLength && stat->arr_keySelf; ++idx) {
            uint32_t rowIdx = dat_read_sizet(dataVariable + varOffset + (DAT_DATA_MODEL_SIZE * idx));
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

static inline bool dat_is_null(uint32_t value) {
  return value == DAT_MAGIC_NULL;
}

static inline uint32_t dat_read_sizet(uint8_t* data) {
  return *(uint32_t*)data;
}

static inline bool dat_is_valid_varoffset(uint32_t offset, uint32_t len, size_t dataVariable_len) {
  return offset >= DAT_MAGIC_BBBB_SIZE && (offset + len) <= dataVariable_len;
}
