cmake_minimum_required(VERSION 3.15)
project(app)

add_executable(app
  src/app/dat/analysis.c
  )

target_link_options(app PRIVATE
  "SHELL:-s WASM=1"
  "SHELL:-s FILESYSTEM=0"
  "SHELL:-s MODULARIZE=1"
  "SHELL:-s STRICT=1"
  "SHELL:-s SINGLE_FILE=1"
  "SHELL:-s ALLOW_MEMORY_GROWTH=1"
  "SHELL:-s MEMORY_GROWTH_GEOMETRIC_STEP=0"
  "SHELL:-s ENVIRONMENT='worker'"
  "SHELL:-s EXPORTED_FUNCTIONS='[_malloc,_free,_app_analyze_dat]'"
  "-O3"
  "-fno-rtti"
  "-fno-exceptions"
  )
