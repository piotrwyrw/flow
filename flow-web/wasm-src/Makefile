FN_EXPORTS = integrate_motions_n malloc free
RUNTIME_EXPORTS = ccall cwrap HEAP8 HEAP16 HEAP32 HEAPU8 HEAPU16 HEAPU32 HEAPF32 HEAPF64

SPACE := $(null) $(null)
COMMA := $(null), $(null)

EXPORTED_FN := $(foreach f,$(FN_EXPORTS),"_$(f)")
EXPORTED_FN_JS := [$(subst $(SPACE),$(COMMA),$(EXPORTED_FN))]

EXPORTED_RUNTIME := $(foreach f,$(RUNTIME_EXPORTS),"$(f)")
EXPORTED_RUNTIME_JS := [$(subst $(SPACE),$(COMMA),$(EXPORTED_RUNTIME))]

SRC = src/particle_math.c
OUTPUT_DIR = ../public/wasm
OUTPUT = $(OUTPUT_DIR)/particle_math.js

CC = emcc
EXPORTS_FLAG =	-sEXPORTED_FUNCTIONS='$(EXPORTED_FN_JS)' \
				-sEXPORTED_RUNTIME_METHODS='$(EXPORTED_RUNTIME_JS)'

CFLAGS =	-O3 \
			-msimd128 \
			-sWASM=1 \
			-sMODULARIZE=1 \
			-sEXPORT_NAME="ParticleMathModule" \
			-DNDEBUG \
			-Iinclude \
			$(EXPORTS_FLAG)

$(OUTPUT): $(SRC)
	mkdir -p $(OUTPUT_DIR)
	$(CC) $(SRC) $(CFLAGS) -o $(OUTPUT)

.PHONY: build
build: $(OUTPUT)

.PHONY: bauen
bauen: build

.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIR)/

.PHONY: sauber
sauber: clean