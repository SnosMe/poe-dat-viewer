<template>
  <q-card style="max-width: 80vw;">
    <q-card-section>
      <div class="q-gutter-xs flex items-baseline">
        <q-input value="patch.poecdn.com/patch/" filled hint="Patch CDN" readonly dense style="width: 200px;" />
        <q-input :value="''" filled hint="Patch #" dense placeholder="3.11.x.x.x" style="width: 100px;" />
        <q-input :value="''" filled hint="Path inside GGPK" dense placeholder="/Data/BaseItemTypes.dat64" style="width: 250px;" />
        <q-btn label="Import" color="primary" />
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <div class="flex items-baseline">
        <q-file
          label="Pick local file"
          accept=".dat,.dat64"
          filled dense
          style="max-width: 250px"
        />
        <q-space />
        <div class="text-caption text-italic text-grey-7 q-mr-sm">0 MB stored</div>
        <q-btn label="Recent files" @click="showRecent = !showRecent"
          flat no-caps dense :icon-right="fasAngleDown" text-color="grey-8" />
      </div>
      <q-slide-transition>
        <div v-show="!showRecent">
          <div class="q-pt-sm">
            Or import <a class="q-link text-primary" style="border-bottom: 1px dashed currentColor;" href="#">demo file</a>
          </div>
        </div>
      </q-slide-transition>
      <q-slide-transition>
        <div v-show="showRecent">
          <div class="q-pt-sm"><q-space /></div>
          <q-list bordered class="rounded-borders q-mt-xs scroll" style="max-height: 40vh;">
            <q-item-label header>Recent files</q-item-label>
            <q-item>
              <q-item-section top>
                <div class="flex q-gutter-x-md items-center">
                  <div class="flex-1">
                    <q-item-label>
                      <span class="text-weight-medium">Data/BaseItemTypes.dat</span>
                      <span class="text-grey-8"> - 3.11.1.2.5</span>
                    </q-item-label>
                    <q-item-label caption>
                      SHA-512: AEFC789474F0BBFE
                    </q-item-label>
                  </div>
                  <div>
                    <q-item-label>2012-09-12</q-item-label>
                  </div>
                  <div>
                    <q-item-label>2.5 MB</q-item-label>
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="text-grey-8 q-gutter-xs">
                  <q-btn class="gt-xs" size="12px" dense label="Delete" outline />
                  <q-btn size="12px" dense label="Open" color="primary" />
                </div>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item>
              <q-item-section top>
                <div class="flex q-gutter-x-md items-center">
                  <div class="flex-1">
                    <q-item-label>
                      <span class="text-weight-medium">Data/BaseItemTypes.dat</span>
                      <span class="text-grey-8"> - 3.11.1.2.5</span>
                    </q-item-label>
                    <q-item-label caption>
                      SHA-512: AEFC789474F0BBFE
                    </q-item-label>
                  </div>
                  <div>
                    <q-item-label>2012-09-12</q-item-label>
                  </div>
                  <div>
                    <q-item-label>2.5 MB</q-item-label>
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="text-grey-8 q-gutter-xs">
                  <q-btn class="gt-xs" size="12px" dense label="Delete" outline />
                  <q-btn size="12px" dense label="Open" color="primary" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-slide-transition>
    </q-card-section>
  </q-card>
</template>

<script>
import { fasAngleDown, fasEraser } from '@quasar/extras/fontawesome-v5'

export default {
  created () {
    this.fasAngleDown = fasAngleDown
    this.ttt = fasEraser
  },
  data () {
    return {
      showRecent: false
    }
  }
}
</script>
