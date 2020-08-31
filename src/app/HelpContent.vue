<template>
  <div class="row bg-white" style="width: 820px; max-width: 80vw;">
    <div class="flex-1 q-pa-md">
      <div class="flex items-center">
        <q-linear-progress rounded size="0.75rem" :value="1" color="brown-4" style="width: 4rem;" />
        <div class="q-ml-sm">Octet is part of String</div>
      </div>
      <div class="flex items-center">
        <q-linear-progress rounded size="0.75rem" :value="1" color="teal-4" style="width: 4rem;" />
        <div class="q-ml-sm">Octet is part of Array</div>
      </div>
      <div class="flex items-center">
        <q-linear-progress rounded size="0.75rem" :value="1" color="grey-10" style="width: 4rem;" />
        <div class="q-ml-sm">All bytes in column are 00</div>
      </div>
      <div class="flex items-center">
        <q-linear-progress rounded size="0.75rem" :value="1" color="pink-4" style="width: 4rem;" />
        <div class="q-ml-sm">Octet is part of NULL</div>
      </div>
      <q-separator spaced />
      <div>Mouse-over octet statistics bar to see the MAX byte value in column.</div>
      <q-separator spaced />
      <div>Dat format has reserved <q-badge class="font-mono" color="grey-8">fe fe fe fe (x32)</q-badge> and <q-badge class="font-mono" color="grey-8">fe fe fe fe fe fe fe fe (x64)</q-badge> for NULL value.</div>
    </div>
    <q-markup-table>
      <thead>
        <tr>
          <th class="text-left">Type</th>
          <th class="text-left">C/C++ type</th>
          <th class="text-right">x32_64</th>
          <th class="text-right">x32 size</th>
          <th class="text-right">x64 size</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-left">String</td>
          <td class="text-left">char16_t*</td>
          <td class="text-right">-</td>
          <td class="text-right">4</td>
          <td class="text-right">8</td>
        </tr>
        <tr>
          <td class="text-left">Array</td>
          <td class="text-left">{ size_t; void* }</td>
          <td class="text-right">-</td>
          <td class="text-right">4 + 4</td>
          <td class="text-right">8 + 8</td>
        </tr>
        <tr>
          <td class="text-left">Key (foreign)</td>
          <td class="text-left">{ size_t; void* }</td>
          <td class="text-right">-</td>
          <td class="text-right">4 + 4</td>
          <td class="text-right">8 + 8</td>
        </tr>
        <tr>
          <td class="text-left">Key (self)</td>
          <td class="text-left">size_t</td>
          <td class="text-right">-</td>
          <td class="text-right">4</td>
          <td class="text-right">8</td>
        </tr>
        <tr>
          <td class="text-left">Decimal</td>
          <td class="text-left">double</td>
          <td class="text-right">8</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
        </tr>
        <tr>
          <td class="text-left">Decimal</td>
          <td class="text-left">float</td>
          <td class="text-right">4</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
        </tr>
        <tr>
          <td class="text-left">Integer</td>
          <td class="text-left">int64_t / uint64_t</td>
          <td class="text-right">8</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
        </tr>
        <tr>
          <td class="text-left">Integer</td>
          <td class="text-left">int32_t / uint32_t</td>
          <td class="text-right">4</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
        </tr>
        <tr>
          <td class="text-left">Integer</td>
          <td class="text-left">int16_t / uint16_t</td>
          <td class="text-right">2</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
        </tr>
        <tr>
          <td class="text-left">Integer</td>
          <td class="text-left">int8_t / uint8_t</td>
          <td class="text-right">1</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
        </tr>
        <tr>
          <td class="text-left">Boolean</td>
          <td class="text-left">bool</td>
          <td class="text-right">1</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>
