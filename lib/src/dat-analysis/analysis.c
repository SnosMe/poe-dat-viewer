#include "analysis.h"

bool dat_is_string_at(uint8_t* start, uint8_t* end) {
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
