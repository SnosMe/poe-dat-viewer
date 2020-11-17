#pragma once

#include <stdint.h>
#include <stdlib.h>
#include <stdbool.h>

#define DAT_MAGIC_BBBB_SIZE 8
#define DAT_STR_TERMINATOR 4

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

void app_analyze_dat32(
  uint8_t* dataFixed, size_t dataFixed_len,
  uint8_t* dataVariable, size_t dataVariable_len,
  size_t row_len,
  app_stat* stats
);
void app_analyze_dat64(
  uint8_t* dataFixed, size_t dataFixed_len,
  uint8_t* dataVariable, size_t dataVariable_len,
  size_t row_len,
  app_stat* stats
);

bool dat_is_string_at(uint8_t* start, uint8_t* end);
