cmake_minimum_required(VERSION 3.15)
project(compute)

add_executable(compute
  dat-analysis/analysis.cpp
  )

target_link_options(compute PRIVATE
  "SHELL:-s FILESYSTEM=0"
  "SHELL:-s MODULARIZE=1"
  "SHELL:-s STRICT=1"
  "SHELL:-s SINGLE_FILE=1"
  "SHELL:-s ALLOW_MEMORY_GROWTH=1"
  "SHELL:-s MEMORY_GROWTH_GEOMETRIC_STEP=0"
  "SHELL:-s ENVIRONMENT='worker'"
  "SHELL:-s EXPORTED_FUNCTIONS='[_malloc,_free,_fast_analyze_dat64]'"
  "-O3"
  "-fno-rtti"
  "-fno-exceptions"
  )
