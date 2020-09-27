<template>
  <q-dialog :value="active" seamless position="bottom">
    <q-card style="width: 350px">
      <q-linear-progress :value="received/totalSize" instant-feedback size="md" :indeterminate="!totalSize" />
      <q-card-section class="row items-center no-wrap">
        <div class="min-w-0">
          <div class="text-weight-bold ellipsis">{{ bundleName }}</div>
          <div class="text-grey">
            <template v-if="totalSize">{{ (totalSize / 1000000).toFixed(1) }} MB</template>
            <template v-else>Downloading...</template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { progress } from './patchcdn/cache'

export default {
  data () {
    return progress
  }
}
</script>
