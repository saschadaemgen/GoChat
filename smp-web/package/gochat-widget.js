"use strict";
var GoChatWidget = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod2) => function __require2() {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
    mod2
  ));
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // (disabled):crypto
  var require_crypto = __commonJS({
    "(disabled):crypto"() {
    }
  });

  // node_modules/tweetnacl/nacl-fast.js
  var require_nacl_fast = __commonJS({
    "node_modules/tweetnacl/nacl-fast.js"(exports, module) {
      (function(nacl7) {
        "use strict";
        var gf = function(init) {
          var i, r = new Float64Array(16);
          if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
          return r;
        };
        var randombytes = function() {
          throw new Error("no PRNG");
        };
        var _0 = new Uint8Array(16);
        var _9 = new Uint8Array(32);
        _9[0] = 9;
        var gf0 = gf(), gf1 = gf([1]), _121665 = gf([56129, 1]), D = gf([30883, 4953, 19914, 30187, 55467, 16705, 2637, 112, 59544, 30585, 16505, 36039, 65139, 11119, 27886, 20995]), D2 = gf([61785, 9906, 39828, 60374, 45398, 33411, 5274, 224, 53552, 61171, 33010, 6542, 64743, 22239, 55772, 9222]), X = gf([54554, 36645, 11616, 51542, 42930, 38181, 51040, 26924, 56412, 64982, 57905, 49316, 21502, 52590, 14035, 8553]), Y = gf([26200, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214]), I = gf([41136, 18958, 6951, 50414, 58488, 44335, 6150, 12099, 55207, 15867, 153, 11085, 57099, 20417, 9344, 11139]);
        function ts64(x, i, h, l) {
          x[i] = h >> 24 & 255;
          x[i + 1] = h >> 16 & 255;
          x[i + 2] = h >> 8 & 255;
          x[i + 3] = h & 255;
          x[i + 4] = l >> 24 & 255;
          x[i + 5] = l >> 16 & 255;
          x[i + 6] = l >> 8 & 255;
          x[i + 7] = l & 255;
        }
        function vn(x, xi, y, yi, n) {
          var i, d = 0;
          for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i];
          return (1 & d - 1 >>> 8) - 1;
        }
        function crypto_verify_16(x, xi, y, yi) {
          return vn(x, xi, y, yi, 16);
        }
        function crypto_verify_32(x, xi, y, yi) {
          return vn(x, xi, y, yi, 32);
        }
        function core_salsa20(o, p, k, c) {
          var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
          var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
          for (var i = 0; i < 20; i += 2) {
            u = x0 + x12 | 0;
            x4 ^= u << 7 | u >>> 32 - 7;
            u = x4 + x0 | 0;
            x8 ^= u << 9 | u >>> 32 - 9;
            u = x8 + x4 | 0;
            x12 ^= u << 13 | u >>> 32 - 13;
            u = x12 + x8 | 0;
            x0 ^= u << 18 | u >>> 32 - 18;
            u = x5 + x1 | 0;
            x9 ^= u << 7 | u >>> 32 - 7;
            u = x9 + x5 | 0;
            x13 ^= u << 9 | u >>> 32 - 9;
            u = x13 + x9 | 0;
            x1 ^= u << 13 | u >>> 32 - 13;
            u = x1 + x13 | 0;
            x5 ^= u << 18 | u >>> 32 - 18;
            u = x10 + x6 | 0;
            x14 ^= u << 7 | u >>> 32 - 7;
            u = x14 + x10 | 0;
            x2 ^= u << 9 | u >>> 32 - 9;
            u = x2 + x14 | 0;
            x6 ^= u << 13 | u >>> 32 - 13;
            u = x6 + x2 | 0;
            x10 ^= u << 18 | u >>> 32 - 18;
            u = x15 + x11 | 0;
            x3 ^= u << 7 | u >>> 32 - 7;
            u = x3 + x15 | 0;
            x7 ^= u << 9 | u >>> 32 - 9;
            u = x7 + x3 | 0;
            x11 ^= u << 13 | u >>> 32 - 13;
            u = x11 + x7 | 0;
            x15 ^= u << 18 | u >>> 32 - 18;
            u = x0 + x3 | 0;
            x1 ^= u << 7 | u >>> 32 - 7;
            u = x1 + x0 | 0;
            x2 ^= u << 9 | u >>> 32 - 9;
            u = x2 + x1 | 0;
            x3 ^= u << 13 | u >>> 32 - 13;
            u = x3 + x2 | 0;
            x0 ^= u << 18 | u >>> 32 - 18;
            u = x5 + x4 | 0;
            x6 ^= u << 7 | u >>> 32 - 7;
            u = x6 + x5 | 0;
            x7 ^= u << 9 | u >>> 32 - 9;
            u = x7 + x6 | 0;
            x4 ^= u << 13 | u >>> 32 - 13;
            u = x4 + x7 | 0;
            x5 ^= u << 18 | u >>> 32 - 18;
            u = x10 + x9 | 0;
            x11 ^= u << 7 | u >>> 32 - 7;
            u = x11 + x10 | 0;
            x8 ^= u << 9 | u >>> 32 - 9;
            u = x8 + x11 | 0;
            x9 ^= u << 13 | u >>> 32 - 13;
            u = x9 + x8 | 0;
            x10 ^= u << 18 | u >>> 32 - 18;
            u = x15 + x14 | 0;
            x12 ^= u << 7 | u >>> 32 - 7;
            u = x12 + x15 | 0;
            x13 ^= u << 9 | u >>> 32 - 9;
            u = x13 + x12 | 0;
            x14 ^= u << 13 | u >>> 32 - 13;
            u = x14 + x13 | 0;
            x15 ^= u << 18 | u >>> 32 - 18;
          }
          x0 = x0 + j0 | 0;
          x1 = x1 + j1 | 0;
          x2 = x2 + j2 | 0;
          x3 = x3 + j3 | 0;
          x4 = x4 + j4 | 0;
          x5 = x5 + j5 | 0;
          x6 = x6 + j6 | 0;
          x7 = x7 + j7 | 0;
          x8 = x8 + j8 | 0;
          x9 = x9 + j9 | 0;
          x10 = x10 + j10 | 0;
          x11 = x11 + j11 | 0;
          x12 = x12 + j12 | 0;
          x13 = x13 + j13 | 0;
          x14 = x14 + j14 | 0;
          x15 = x15 + j15 | 0;
          o[0] = x0 >>> 0 & 255;
          o[1] = x0 >>> 8 & 255;
          o[2] = x0 >>> 16 & 255;
          o[3] = x0 >>> 24 & 255;
          o[4] = x1 >>> 0 & 255;
          o[5] = x1 >>> 8 & 255;
          o[6] = x1 >>> 16 & 255;
          o[7] = x1 >>> 24 & 255;
          o[8] = x2 >>> 0 & 255;
          o[9] = x2 >>> 8 & 255;
          o[10] = x2 >>> 16 & 255;
          o[11] = x2 >>> 24 & 255;
          o[12] = x3 >>> 0 & 255;
          o[13] = x3 >>> 8 & 255;
          o[14] = x3 >>> 16 & 255;
          o[15] = x3 >>> 24 & 255;
          o[16] = x4 >>> 0 & 255;
          o[17] = x4 >>> 8 & 255;
          o[18] = x4 >>> 16 & 255;
          o[19] = x4 >>> 24 & 255;
          o[20] = x5 >>> 0 & 255;
          o[21] = x5 >>> 8 & 255;
          o[22] = x5 >>> 16 & 255;
          o[23] = x5 >>> 24 & 255;
          o[24] = x6 >>> 0 & 255;
          o[25] = x6 >>> 8 & 255;
          o[26] = x6 >>> 16 & 255;
          o[27] = x6 >>> 24 & 255;
          o[28] = x7 >>> 0 & 255;
          o[29] = x7 >>> 8 & 255;
          o[30] = x7 >>> 16 & 255;
          o[31] = x7 >>> 24 & 255;
          o[32] = x8 >>> 0 & 255;
          o[33] = x8 >>> 8 & 255;
          o[34] = x8 >>> 16 & 255;
          o[35] = x8 >>> 24 & 255;
          o[36] = x9 >>> 0 & 255;
          o[37] = x9 >>> 8 & 255;
          o[38] = x9 >>> 16 & 255;
          o[39] = x9 >>> 24 & 255;
          o[40] = x10 >>> 0 & 255;
          o[41] = x10 >>> 8 & 255;
          o[42] = x10 >>> 16 & 255;
          o[43] = x10 >>> 24 & 255;
          o[44] = x11 >>> 0 & 255;
          o[45] = x11 >>> 8 & 255;
          o[46] = x11 >>> 16 & 255;
          o[47] = x11 >>> 24 & 255;
          o[48] = x12 >>> 0 & 255;
          o[49] = x12 >>> 8 & 255;
          o[50] = x12 >>> 16 & 255;
          o[51] = x12 >>> 24 & 255;
          o[52] = x13 >>> 0 & 255;
          o[53] = x13 >>> 8 & 255;
          o[54] = x13 >>> 16 & 255;
          o[55] = x13 >>> 24 & 255;
          o[56] = x14 >>> 0 & 255;
          o[57] = x14 >>> 8 & 255;
          o[58] = x14 >>> 16 & 255;
          o[59] = x14 >>> 24 & 255;
          o[60] = x15 >>> 0 & 255;
          o[61] = x15 >>> 8 & 255;
          o[62] = x15 >>> 16 & 255;
          o[63] = x15 >>> 24 & 255;
        }
        function core_hsalsa20(o, p, k, c) {
          var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
          var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
          for (var i = 0; i < 20; i += 2) {
            u = x0 + x12 | 0;
            x4 ^= u << 7 | u >>> 32 - 7;
            u = x4 + x0 | 0;
            x8 ^= u << 9 | u >>> 32 - 9;
            u = x8 + x4 | 0;
            x12 ^= u << 13 | u >>> 32 - 13;
            u = x12 + x8 | 0;
            x0 ^= u << 18 | u >>> 32 - 18;
            u = x5 + x1 | 0;
            x9 ^= u << 7 | u >>> 32 - 7;
            u = x9 + x5 | 0;
            x13 ^= u << 9 | u >>> 32 - 9;
            u = x13 + x9 | 0;
            x1 ^= u << 13 | u >>> 32 - 13;
            u = x1 + x13 | 0;
            x5 ^= u << 18 | u >>> 32 - 18;
            u = x10 + x6 | 0;
            x14 ^= u << 7 | u >>> 32 - 7;
            u = x14 + x10 | 0;
            x2 ^= u << 9 | u >>> 32 - 9;
            u = x2 + x14 | 0;
            x6 ^= u << 13 | u >>> 32 - 13;
            u = x6 + x2 | 0;
            x10 ^= u << 18 | u >>> 32 - 18;
            u = x15 + x11 | 0;
            x3 ^= u << 7 | u >>> 32 - 7;
            u = x3 + x15 | 0;
            x7 ^= u << 9 | u >>> 32 - 9;
            u = x7 + x3 | 0;
            x11 ^= u << 13 | u >>> 32 - 13;
            u = x11 + x7 | 0;
            x15 ^= u << 18 | u >>> 32 - 18;
            u = x0 + x3 | 0;
            x1 ^= u << 7 | u >>> 32 - 7;
            u = x1 + x0 | 0;
            x2 ^= u << 9 | u >>> 32 - 9;
            u = x2 + x1 | 0;
            x3 ^= u << 13 | u >>> 32 - 13;
            u = x3 + x2 | 0;
            x0 ^= u << 18 | u >>> 32 - 18;
            u = x5 + x4 | 0;
            x6 ^= u << 7 | u >>> 32 - 7;
            u = x6 + x5 | 0;
            x7 ^= u << 9 | u >>> 32 - 9;
            u = x7 + x6 | 0;
            x4 ^= u << 13 | u >>> 32 - 13;
            u = x4 + x7 | 0;
            x5 ^= u << 18 | u >>> 32 - 18;
            u = x10 + x9 | 0;
            x11 ^= u << 7 | u >>> 32 - 7;
            u = x11 + x10 | 0;
            x8 ^= u << 9 | u >>> 32 - 9;
            u = x8 + x11 | 0;
            x9 ^= u << 13 | u >>> 32 - 13;
            u = x9 + x8 | 0;
            x10 ^= u << 18 | u >>> 32 - 18;
            u = x15 + x14 | 0;
            x12 ^= u << 7 | u >>> 32 - 7;
            u = x12 + x15 | 0;
            x13 ^= u << 9 | u >>> 32 - 9;
            u = x13 + x12 | 0;
            x14 ^= u << 13 | u >>> 32 - 13;
            u = x14 + x13 | 0;
            x15 ^= u << 18 | u >>> 32 - 18;
          }
          o[0] = x0 >>> 0 & 255;
          o[1] = x0 >>> 8 & 255;
          o[2] = x0 >>> 16 & 255;
          o[3] = x0 >>> 24 & 255;
          o[4] = x5 >>> 0 & 255;
          o[5] = x5 >>> 8 & 255;
          o[6] = x5 >>> 16 & 255;
          o[7] = x5 >>> 24 & 255;
          o[8] = x10 >>> 0 & 255;
          o[9] = x10 >>> 8 & 255;
          o[10] = x10 >>> 16 & 255;
          o[11] = x10 >>> 24 & 255;
          o[12] = x15 >>> 0 & 255;
          o[13] = x15 >>> 8 & 255;
          o[14] = x15 >>> 16 & 255;
          o[15] = x15 >>> 24 & 255;
          o[16] = x6 >>> 0 & 255;
          o[17] = x6 >>> 8 & 255;
          o[18] = x6 >>> 16 & 255;
          o[19] = x6 >>> 24 & 255;
          o[20] = x7 >>> 0 & 255;
          o[21] = x7 >>> 8 & 255;
          o[22] = x7 >>> 16 & 255;
          o[23] = x7 >>> 24 & 255;
          o[24] = x8 >>> 0 & 255;
          o[25] = x8 >>> 8 & 255;
          o[26] = x8 >>> 16 & 255;
          o[27] = x8 >>> 24 & 255;
          o[28] = x9 >>> 0 & 255;
          o[29] = x9 >>> 8 & 255;
          o[30] = x9 >>> 16 & 255;
          o[31] = x9 >>> 24 & 255;
        }
        function crypto_core_salsa20(out, inp, k, c) {
          core_salsa20(out, inp, k, c);
        }
        function crypto_core_hsalsa20(out, inp, k, c) {
          core_hsalsa20(out, inp, k, c);
        }
        var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
        function crypto_stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
          var z = new Uint8Array(16), x = new Uint8Array(64);
          var u, i;
          for (i = 0; i < 16; i++) z[i] = 0;
          for (i = 0; i < 8; i++) z[i] = n[i];
          while (b >= 64) {
            crypto_core_salsa20(x, z, k, sigma);
            for (i = 0; i < 64; i++) c[cpos + i] = m[mpos + i] ^ x[i];
            u = 1;
            for (i = 8; i < 16; i++) {
              u = u + (z[i] & 255) | 0;
              z[i] = u & 255;
              u >>>= 8;
            }
            b -= 64;
            cpos += 64;
            mpos += 64;
          }
          if (b > 0) {
            crypto_core_salsa20(x, z, k, sigma);
            for (i = 0; i < b; i++) c[cpos + i] = m[mpos + i] ^ x[i];
          }
          return 0;
        }
        function crypto_stream_salsa20(c, cpos, b, n, k) {
          var z = new Uint8Array(16), x = new Uint8Array(64);
          var u, i;
          for (i = 0; i < 16; i++) z[i] = 0;
          for (i = 0; i < 8; i++) z[i] = n[i];
          while (b >= 64) {
            crypto_core_salsa20(x, z, k, sigma);
            for (i = 0; i < 64; i++) c[cpos + i] = x[i];
            u = 1;
            for (i = 8; i < 16; i++) {
              u = u + (z[i] & 255) | 0;
              z[i] = u & 255;
              u >>>= 8;
            }
            b -= 64;
            cpos += 64;
          }
          if (b > 0) {
            crypto_core_salsa20(x, z, k, sigma);
            for (i = 0; i < b; i++) c[cpos + i] = x[i];
          }
          return 0;
        }
        function crypto_stream(c, cpos, d, n, k) {
          var s = new Uint8Array(32);
          crypto_core_hsalsa20(s, n, k, sigma);
          var sn = new Uint8Array(8);
          for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
          return crypto_stream_salsa20(c, cpos, d, sn, s);
        }
        function crypto_stream_xor(c, cpos, m, mpos, d, n, k) {
          var s = new Uint8Array(32);
          crypto_core_hsalsa20(s, n, k, sigma);
          var sn = new Uint8Array(8);
          for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
          return crypto_stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
        }
        var poly13052 = function(key) {
          this.buffer = new Uint8Array(16);
          this.r = new Uint16Array(10);
          this.h = new Uint16Array(10);
          this.pad = new Uint16Array(8);
          this.leftover = 0;
          this.fin = 0;
          var t0, t1, t2, t3, t4, t5, t6, t7;
          t0 = key[0] & 255 | (key[1] & 255) << 8;
          this.r[0] = t0 & 8191;
          t1 = key[2] & 255 | (key[3] & 255) << 8;
          this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
          t2 = key[4] & 255 | (key[5] & 255) << 8;
          this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
          t3 = key[6] & 255 | (key[7] & 255) << 8;
          this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
          t4 = key[8] & 255 | (key[9] & 255) << 8;
          this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
          this.r[5] = t4 >>> 1 & 8190;
          t5 = key[10] & 255 | (key[11] & 255) << 8;
          this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
          t6 = key[12] & 255 | (key[13] & 255) << 8;
          this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
          t7 = key[14] & 255 | (key[15] & 255) << 8;
          this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
          this.r[9] = t7 >>> 5 & 127;
          this.pad[0] = key[16] & 255 | (key[17] & 255) << 8;
          this.pad[1] = key[18] & 255 | (key[19] & 255) << 8;
          this.pad[2] = key[20] & 255 | (key[21] & 255) << 8;
          this.pad[3] = key[22] & 255 | (key[23] & 255) << 8;
          this.pad[4] = key[24] & 255 | (key[25] & 255) << 8;
          this.pad[5] = key[26] & 255 | (key[27] & 255) << 8;
          this.pad[6] = key[28] & 255 | (key[29] & 255) << 8;
          this.pad[7] = key[30] & 255 | (key[31] & 255) << 8;
        };
        poly13052.prototype.blocks = function(m, mpos, bytes) {
          var hibit = this.fin ? 0 : 1 << 11;
          var t0, t1, t2, t3, t4, t5, t6, t7, c;
          var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
          var h0 = this.h[0], h1 = this.h[1], h2 = this.h[2], h3 = this.h[3], h4 = this.h[4], h5 = this.h[5], h6 = this.h[6], h7 = this.h[7], h8 = this.h[8], h9 = this.h[9];
          var r0 = this.r[0], r1 = this.r[1], r2 = this.r[2], r3 = this.r[3], r4 = this.r[4], r5 = this.r[5], r6 = this.r[6], r7 = this.r[7], r8 = this.r[8], r9 = this.r[9];
          while (bytes >= 16) {
            t0 = m[mpos + 0] & 255 | (m[mpos + 1] & 255) << 8;
            h0 += t0 & 8191;
            t1 = m[mpos + 2] & 255 | (m[mpos + 3] & 255) << 8;
            h1 += (t0 >>> 13 | t1 << 3) & 8191;
            t2 = m[mpos + 4] & 255 | (m[mpos + 5] & 255) << 8;
            h2 += (t1 >>> 10 | t2 << 6) & 8191;
            t3 = m[mpos + 6] & 255 | (m[mpos + 7] & 255) << 8;
            h3 += (t2 >>> 7 | t3 << 9) & 8191;
            t4 = m[mpos + 8] & 255 | (m[mpos + 9] & 255) << 8;
            h4 += (t3 >>> 4 | t4 << 12) & 8191;
            h5 += t4 >>> 1 & 8191;
            t5 = m[mpos + 10] & 255 | (m[mpos + 11] & 255) << 8;
            h6 += (t4 >>> 14 | t5 << 2) & 8191;
            t6 = m[mpos + 12] & 255 | (m[mpos + 13] & 255) << 8;
            h7 += (t5 >>> 11 | t6 << 5) & 8191;
            t7 = m[mpos + 14] & 255 | (m[mpos + 15] & 255) << 8;
            h8 += (t6 >>> 8 | t7 << 8) & 8191;
            h9 += t7 >>> 5 | hibit;
            c = 0;
            d0 = c;
            d0 += h0 * r0;
            d0 += h1 * (5 * r9);
            d0 += h2 * (5 * r8);
            d0 += h3 * (5 * r7);
            d0 += h4 * (5 * r6);
            c = d0 >>> 13;
            d0 &= 8191;
            d0 += h5 * (5 * r5);
            d0 += h6 * (5 * r4);
            d0 += h7 * (5 * r3);
            d0 += h8 * (5 * r2);
            d0 += h9 * (5 * r1);
            c += d0 >>> 13;
            d0 &= 8191;
            d1 = c;
            d1 += h0 * r1;
            d1 += h1 * r0;
            d1 += h2 * (5 * r9);
            d1 += h3 * (5 * r8);
            d1 += h4 * (5 * r7);
            c = d1 >>> 13;
            d1 &= 8191;
            d1 += h5 * (5 * r6);
            d1 += h6 * (5 * r5);
            d1 += h7 * (5 * r4);
            d1 += h8 * (5 * r3);
            d1 += h9 * (5 * r2);
            c += d1 >>> 13;
            d1 &= 8191;
            d2 = c;
            d2 += h0 * r2;
            d2 += h1 * r1;
            d2 += h2 * r0;
            d2 += h3 * (5 * r9);
            d2 += h4 * (5 * r8);
            c = d2 >>> 13;
            d2 &= 8191;
            d2 += h5 * (5 * r7);
            d2 += h6 * (5 * r6);
            d2 += h7 * (5 * r5);
            d2 += h8 * (5 * r4);
            d2 += h9 * (5 * r3);
            c += d2 >>> 13;
            d2 &= 8191;
            d3 = c;
            d3 += h0 * r3;
            d3 += h1 * r2;
            d3 += h2 * r1;
            d3 += h3 * r0;
            d3 += h4 * (5 * r9);
            c = d3 >>> 13;
            d3 &= 8191;
            d3 += h5 * (5 * r8);
            d3 += h6 * (5 * r7);
            d3 += h7 * (5 * r6);
            d3 += h8 * (5 * r5);
            d3 += h9 * (5 * r4);
            c += d3 >>> 13;
            d3 &= 8191;
            d4 = c;
            d4 += h0 * r4;
            d4 += h1 * r3;
            d4 += h2 * r2;
            d4 += h3 * r1;
            d4 += h4 * r0;
            c = d4 >>> 13;
            d4 &= 8191;
            d4 += h5 * (5 * r9);
            d4 += h6 * (5 * r8);
            d4 += h7 * (5 * r7);
            d4 += h8 * (5 * r6);
            d4 += h9 * (5 * r5);
            c += d4 >>> 13;
            d4 &= 8191;
            d5 = c;
            d5 += h0 * r5;
            d5 += h1 * r4;
            d5 += h2 * r3;
            d5 += h3 * r2;
            d5 += h4 * r1;
            c = d5 >>> 13;
            d5 &= 8191;
            d5 += h5 * r0;
            d5 += h6 * (5 * r9);
            d5 += h7 * (5 * r8);
            d5 += h8 * (5 * r7);
            d5 += h9 * (5 * r6);
            c += d5 >>> 13;
            d5 &= 8191;
            d6 = c;
            d6 += h0 * r6;
            d6 += h1 * r5;
            d6 += h2 * r4;
            d6 += h3 * r3;
            d6 += h4 * r2;
            c = d6 >>> 13;
            d6 &= 8191;
            d6 += h5 * r1;
            d6 += h6 * r0;
            d6 += h7 * (5 * r9);
            d6 += h8 * (5 * r8);
            d6 += h9 * (5 * r7);
            c += d6 >>> 13;
            d6 &= 8191;
            d7 = c;
            d7 += h0 * r7;
            d7 += h1 * r6;
            d7 += h2 * r5;
            d7 += h3 * r4;
            d7 += h4 * r3;
            c = d7 >>> 13;
            d7 &= 8191;
            d7 += h5 * r2;
            d7 += h6 * r1;
            d7 += h7 * r0;
            d7 += h8 * (5 * r9);
            d7 += h9 * (5 * r8);
            c += d7 >>> 13;
            d7 &= 8191;
            d8 = c;
            d8 += h0 * r8;
            d8 += h1 * r7;
            d8 += h2 * r6;
            d8 += h3 * r5;
            d8 += h4 * r4;
            c = d8 >>> 13;
            d8 &= 8191;
            d8 += h5 * r3;
            d8 += h6 * r2;
            d8 += h7 * r1;
            d8 += h8 * r0;
            d8 += h9 * (5 * r9);
            c += d8 >>> 13;
            d8 &= 8191;
            d9 = c;
            d9 += h0 * r9;
            d9 += h1 * r8;
            d9 += h2 * r7;
            d9 += h3 * r6;
            d9 += h4 * r5;
            c = d9 >>> 13;
            d9 &= 8191;
            d9 += h5 * r4;
            d9 += h6 * r3;
            d9 += h7 * r2;
            d9 += h8 * r1;
            d9 += h9 * r0;
            c += d9 >>> 13;
            d9 &= 8191;
            c = (c << 2) + c | 0;
            c = c + d0 | 0;
            d0 = c & 8191;
            c = c >>> 13;
            d1 += c;
            h0 = d0;
            h1 = d1;
            h2 = d2;
            h3 = d3;
            h4 = d4;
            h5 = d5;
            h6 = d6;
            h7 = d7;
            h8 = d8;
            h9 = d9;
            mpos += 16;
            bytes -= 16;
          }
          this.h[0] = h0;
          this.h[1] = h1;
          this.h[2] = h2;
          this.h[3] = h3;
          this.h[4] = h4;
          this.h[5] = h5;
          this.h[6] = h6;
          this.h[7] = h7;
          this.h[8] = h8;
          this.h[9] = h9;
        };
        poly13052.prototype.finish = function(mac, macpos) {
          var g = new Uint16Array(10);
          var c, mask, f, i;
          if (this.leftover) {
            i = this.leftover;
            this.buffer[i++] = 1;
            for (; i < 16; i++) this.buffer[i] = 0;
            this.fin = 1;
            this.blocks(this.buffer, 0, 16);
          }
          c = this.h[1] >>> 13;
          this.h[1] &= 8191;
          for (i = 2; i < 10; i++) {
            this.h[i] += c;
            c = this.h[i] >>> 13;
            this.h[i] &= 8191;
          }
          this.h[0] += c * 5;
          c = this.h[0] >>> 13;
          this.h[0] &= 8191;
          this.h[1] += c;
          c = this.h[1] >>> 13;
          this.h[1] &= 8191;
          this.h[2] += c;
          g[0] = this.h[0] + 5;
          c = g[0] >>> 13;
          g[0] &= 8191;
          for (i = 1; i < 10; i++) {
            g[i] = this.h[i] + c;
            c = g[i] >>> 13;
            g[i] &= 8191;
          }
          g[9] -= 1 << 13;
          mask = (c ^ 1) - 1;
          for (i = 0; i < 10; i++) g[i] &= mask;
          mask = ~mask;
          for (i = 0; i < 10; i++) this.h[i] = this.h[i] & mask | g[i];
          this.h[0] = (this.h[0] | this.h[1] << 13) & 65535;
          this.h[1] = (this.h[1] >>> 3 | this.h[2] << 10) & 65535;
          this.h[2] = (this.h[2] >>> 6 | this.h[3] << 7) & 65535;
          this.h[3] = (this.h[3] >>> 9 | this.h[4] << 4) & 65535;
          this.h[4] = (this.h[4] >>> 12 | this.h[5] << 1 | this.h[6] << 14) & 65535;
          this.h[5] = (this.h[6] >>> 2 | this.h[7] << 11) & 65535;
          this.h[6] = (this.h[7] >>> 5 | this.h[8] << 8) & 65535;
          this.h[7] = (this.h[8] >>> 8 | this.h[9] << 5) & 65535;
          f = this.h[0] + this.pad[0];
          this.h[0] = f & 65535;
          for (i = 1; i < 8; i++) {
            f = (this.h[i] + this.pad[i] | 0) + (f >>> 16) | 0;
            this.h[i] = f & 65535;
          }
          mac[macpos + 0] = this.h[0] >>> 0 & 255;
          mac[macpos + 1] = this.h[0] >>> 8 & 255;
          mac[macpos + 2] = this.h[1] >>> 0 & 255;
          mac[macpos + 3] = this.h[1] >>> 8 & 255;
          mac[macpos + 4] = this.h[2] >>> 0 & 255;
          mac[macpos + 5] = this.h[2] >>> 8 & 255;
          mac[macpos + 6] = this.h[3] >>> 0 & 255;
          mac[macpos + 7] = this.h[3] >>> 8 & 255;
          mac[macpos + 8] = this.h[4] >>> 0 & 255;
          mac[macpos + 9] = this.h[4] >>> 8 & 255;
          mac[macpos + 10] = this.h[5] >>> 0 & 255;
          mac[macpos + 11] = this.h[5] >>> 8 & 255;
          mac[macpos + 12] = this.h[6] >>> 0 & 255;
          mac[macpos + 13] = this.h[6] >>> 8 & 255;
          mac[macpos + 14] = this.h[7] >>> 0 & 255;
          mac[macpos + 15] = this.h[7] >>> 8 & 255;
        };
        poly13052.prototype.update = function(m, mpos, bytes) {
          var i, want;
          if (this.leftover) {
            want = 16 - this.leftover;
            if (want > bytes)
              want = bytes;
            for (i = 0; i < want; i++)
              this.buffer[this.leftover + i] = m[mpos + i];
            bytes -= want;
            mpos += want;
            this.leftover += want;
            if (this.leftover < 16)
              return;
            this.blocks(this.buffer, 0, 16);
            this.leftover = 0;
          }
          if (bytes >= 16) {
            want = bytes - bytes % 16;
            this.blocks(m, mpos, want);
            mpos += want;
            bytes -= want;
          }
          if (bytes) {
            for (i = 0; i < bytes; i++)
              this.buffer[this.leftover + i] = m[mpos + i];
            this.leftover += bytes;
          }
        };
        function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
          var s = new poly13052(k);
          s.update(m, mpos, n);
          s.finish(out, outpos);
          return 0;
        }
        function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
          var x = new Uint8Array(16);
          crypto_onetimeauth(x, 0, m, mpos, n, k);
          return crypto_verify_16(h, hpos, x, 0);
        }
        function crypto_secretbox(c, m, d, n, k) {
          var i;
          if (d < 32) return -1;
          crypto_stream_xor(c, 0, m, 0, d, n, k);
          crypto_onetimeauth(c, 16, c, 32, d - 32, c);
          for (i = 0; i < 16; i++) c[i] = 0;
          return 0;
        }
        function crypto_secretbox_open(m, c, d, n, k) {
          var i;
          var x = new Uint8Array(32);
          if (d < 32) return -1;
          crypto_stream(x, 0, 32, n, k);
          if (crypto_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0) return -1;
          crypto_stream_xor(m, 0, c, 0, d, n, k);
          for (i = 0; i < 32; i++) m[i] = 0;
          return 0;
        }
        function set25519(r, a) {
          var i;
          for (i = 0; i < 16; i++) r[i] = a[i] | 0;
        }
        function car25519(o) {
          var i, v, c = 1;
          for (i = 0; i < 16; i++) {
            v = o[i] + c + 65535;
            c = Math.floor(v / 65536);
            o[i] = v - c * 65536;
          }
          o[0] += c - 1 + 37 * (c - 1);
        }
        function sel25519(p, q, b) {
          var t, c = ~(b - 1);
          for (var i = 0; i < 16; i++) {
            t = c & (p[i] ^ q[i]);
            p[i] ^= t;
            q[i] ^= t;
          }
        }
        function pack25519(o, n) {
          var i, j, b;
          var m = gf(), t = gf();
          for (i = 0; i < 16; i++) t[i] = n[i];
          car25519(t);
          car25519(t);
          car25519(t);
          for (j = 0; j < 2; j++) {
            m[0] = t[0] - 65517;
            for (i = 1; i < 15; i++) {
              m[i] = t[i] - 65535 - (m[i - 1] >> 16 & 1);
              m[i - 1] &= 65535;
            }
            m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
            b = m[15] >> 16 & 1;
            m[14] &= 65535;
            sel25519(t, m, 1 - b);
          }
          for (i = 0; i < 16; i++) {
            o[2 * i] = t[i] & 255;
            o[2 * i + 1] = t[i] >> 8;
          }
        }
        function neq25519(a, b) {
          var c = new Uint8Array(32), d = new Uint8Array(32);
          pack25519(c, a);
          pack25519(d, b);
          return crypto_verify_32(c, 0, d, 0);
        }
        function par25519(a) {
          var d = new Uint8Array(32);
          pack25519(d, a);
          return d[0] & 1;
        }
        function unpack25519(o, n) {
          var i;
          for (i = 0; i < 16; i++) o[i] = n[2 * i] + (n[2 * i + 1] << 8);
          o[15] &= 32767;
        }
        function A(o, a, b) {
          for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
        }
        function Z(o, a, b) {
          for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
        }
        function M(o, a, b) {
          var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
          v = a[0];
          t0 += v * b0;
          t1 += v * b1;
          t2 += v * b2;
          t3 += v * b3;
          t4 += v * b4;
          t5 += v * b5;
          t6 += v * b6;
          t7 += v * b7;
          t8 += v * b8;
          t9 += v * b9;
          t10 += v * b10;
          t11 += v * b11;
          t12 += v * b12;
          t13 += v * b13;
          t14 += v * b14;
          t15 += v * b15;
          v = a[1];
          t1 += v * b0;
          t2 += v * b1;
          t3 += v * b2;
          t4 += v * b3;
          t5 += v * b4;
          t6 += v * b5;
          t7 += v * b6;
          t8 += v * b7;
          t9 += v * b8;
          t10 += v * b9;
          t11 += v * b10;
          t12 += v * b11;
          t13 += v * b12;
          t14 += v * b13;
          t15 += v * b14;
          t16 += v * b15;
          v = a[2];
          t2 += v * b0;
          t3 += v * b1;
          t4 += v * b2;
          t5 += v * b3;
          t6 += v * b4;
          t7 += v * b5;
          t8 += v * b6;
          t9 += v * b7;
          t10 += v * b8;
          t11 += v * b9;
          t12 += v * b10;
          t13 += v * b11;
          t14 += v * b12;
          t15 += v * b13;
          t16 += v * b14;
          t17 += v * b15;
          v = a[3];
          t3 += v * b0;
          t4 += v * b1;
          t5 += v * b2;
          t6 += v * b3;
          t7 += v * b4;
          t8 += v * b5;
          t9 += v * b6;
          t10 += v * b7;
          t11 += v * b8;
          t12 += v * b9;
          t13 += v * b10;
          t14 += v * b11;
          t15 += v * b12;
          t16 += v * b13;
          t17 += v * b14;
          t18 += v * b15;
          v = a[4];
          t4 += v * b0;
          t5 += v * b1;
          t6 += v * b2;
          t7 += v * b3;
          t8 += v * b4;
          t9 += v * b5;
          t10 += v * b6;
          t11 += v * b7;
          t12 += v * b8;
          t13 += v * b9;
          t14 += v * b10;
          t15 += v * b11;
          t16 += v * b12;
          t17 += v * b13;
          t18 += v * b14;
          t19 += v * b15;
          v = a[5];
          t5 += v * b0;
          t6 += v * b1;
          t7 += v * b2;
          t8 += v * b3;
          t9 += v * b4;
          t10 += v * b5;
          t11 += v * b6;
          t12 += v * b7;
          t13 += v * b8;
          t14 += v * b9;
          t15 += v * b10;
          t16 += v * b11;
          t17 += v * b12;
          t18 += v * b13;
          t19 += v * b14;
          t20 += v * b15;
          v = a[6];
          t6 += v * b0;
          t7 += v * b1;
          t8 += v * b2;
          t9 += v * b3;
          t10 += v * b4;
          t11 += v * b5;
          t12 += v * b6;
          t13 += v * b7;
          t14 += v * b8;
          t15 += v * b9;
          t16 += v * b10;
          t17 += v * b11;
          t18 += v * b12;
          t19 += v * b13;
          t20 += v * b14;
          t21 += v * b15;
          v = a[7];
          t7 += v * b0;
          t8 += v * b1;
          t9 += v * b2;
          t10 += v * b3;
          t11 += v * b4;
          t12 += v * b5;
          t13 += v * b6;
          t14 += v * b7;
          t15 += v * b8;
          t16 += v * b9;
          t17 += v * b10;
          t18 += v * b11;
          t19 += v * b12;
          t20 += v * b13;
          t21 += v * b14;
          t22 += v * b15;
          v = a[8];
          t8 += v * b0;
          t9 += v * b1;
          t10 += v * b2;
          t11 += v * b3;
          t12 += v * b4;
          t13 += v * b5;
          t14 += v * b6;
          t15 += v * b7;
          t16 += v * b8;
          t17 += v * b9;
          t18 += v * b10;
          t19 += v * b11;
          t20 += v * b12;
          t21 += v * b13;
          t22 += v * b14;
          t23 += v * b15;
          v = a[9];
          t9 += v * b0;
          t10 += v * b1;
          t11 += v * b2;
          t12 += v * b3;
          t13 += v * b4;
          t14 += v * b5;
          t15 += v * b6;
          t16 += v * b7;
          t17 += v * b8;
          t18 += v * b9;
          t19 += v * b10;
          t20 += v * b11;
          t21 += v * b12;
          t22 += v * b13;
          t23 += v * b14;
          t24 += v * b15;
          v = a[10];
          t10 += v * b0;
          t11 += v * b1;
          t12 += v * b2;
          t13 += v * b3;
          t14 += v * b4;
          t15 += v * b5;
          t16 += v * b6;
          t17 += v * b7;
          t18 += v * b8;
          t19 += v * b9;
          t20 += v * b10;
          t21 += v * b11;
          t22 += v * b12;
          t23 += v * b13;
          t24 += v * b14;
          t25 += v * b15;
          v = a[11];
          t11 += v * b0;
          t12 += v * b1;
          t13 += v * b2;
          t14 += v * b3;
          t15 += v * b4;
          t16 += v * b5;
          t17 += v * b6;
          t18 += v * b7;
          t19 += v * b8;
          t20 += v * b9;
          t21 += v * b10;
          t22 += v * b11;
          t23 += v * b12;
          t24 += v * b13;
          t25 += v * b14;
          t26 += v * b15;
          v = a[12];
          t12 += v * b0;
          t13 += v * b1;
          t14 += v * b2;
          t15 += v * b3;
          t16 += v * b4;
          t17 += v * b5;
          t18 += v * b6;
          t19 += v * b7;
          t20 += v * b8;
          t21 += v * b9;
          t22 += v * b10;
          t23 += v * b11;
          t24 += v * b12;
          t25 += v * b13;
          t26 += v * b14;
          t27 += v * b15;
          v = a[13];
          t13 += v * b0;
          t14 += v * b1;
          t15 += v * b2;
          t16 += v * b3;
          t17 += v * b4;
          t18 += v * b5;
          t19 += v * b6;
          t20 += v * b7;
          t21 += v * b8;
          t22 += v * b9;
          t23 += v * b10;
          t24 += v * b11;
          t25 += v * b12;
          t26 += v * b13;
          t27 += v * b14;
          t28 += v * b15;
          v = a[14];
          t14 += v * b0;
          t15 += v * b1;
          t16 += v * b2;
          t17 += v * b3;
          t18 += v * b4;
          t19 += v * b5;
          t20 += v * b6;
          t21 += v * b7;
          t22 += v * b8;
          t23 += v * b9;
          t24 += v * b10;
          t25 += v * b11;
          t26 += v * b12;
          t27 += v * b13;
          t28 += v * b14;
          t29 += v * b15;
          v = a[15];
          t15 += v * b0;
          t16 += v * b1;
          t17 += v * b2;
          t18 += v * b3;
          t19 += v * b4;
          t20 += v * b5;
          t21 += v * b6;
          t22 += v * b7;
          t23 += v * b8;
          t24 += v * b9;
          t25 += v * b10;
          t26 += v * b11;
          t27 += v * b12;
          t28 += v * b13;
          t29 += v * b14;
          t30 += v * b15;
          t0 += 38 * t16;
          t1 += 38 * t17;
          t2 += 38 * t18;
          t3 += 38 * t19;
          t4 += 38 * t20;
          t5 += 38 * t21;
          t6 += 38 * t22;
          t7 += 38 * t23;
          t8 += 38 * t24;
          t9 += 38 * t25;
          t10 += 38 * t26;
          t11 += 38 * t27;
          t12 += 38 * t28;
          t13 += 38 * t29;
          t14 += 38 * t30;
          c = 1;
          v = t0 + c + 65535;
          c = Math.floor(v / 65536);
          t0 = v - c * 65536;
          v = t1 + c + 65535;
          c = Math.floor(v / 65536);
          t1 = v - c * 65536;
          v = t2 + c + 65535;
          c = Math.floor(v / 65536);
          t2 = v - c * 65536;
          v = t3 + c + 65535;
          c = Math.floor(v / 65536);
          t3 = v - c * 65536;
          v = t4 + c + 65535;
          c = Math.floor(v / 65536);
          t4 = v - c * 65536;
          v = t5 + c + 65535;
          c = Math.floor(v / 65536);
          t5 = v - c * 65536;
          v = t6 + c + 65535;
          c = Math.floor(v / 65536);
          t6 = v - c * 65536;
          v = t7 + c + 65535;
          c = Math.floor(v / 65536);
          t7 = v - c * 65536;
          v = t8 + c + 65535;
          c = Math.floor(v / 65536);
          t8 = v - c * 65536;
          v = t9 + c + 65535;
          c = Math.floor(v / 65536);
          t9 = v - c * 65536;
          v = t10 + c + 65535;
          c = Math.floor(v / 65536);
          t10 = v - c * 65536;
          v = t11 + c + 65535;
          c = Math.floor(v / 65536);
          t11 = v - c * 65536;
          v = t12 + c + 65535;
          c = Math.floor(v / 65536);
          t12 = v - c * 65536;
          v = t13 + c + 65535;
          c = Math.floor(v / 65536);
          t13 = v - c * 65536;
          v = t14 + c + 65535;
          c = Math.floor(v / 65536);
          t14 = v - c * 65536;
          v = t15 + c + 65535;
          c = Math.floor(v / 65536);
          t15 = v - c * 65536;
          t0 += c - 1 + 37 * (c - 1);
          c = 1;
          v = t0 + c + 65535;
          c = Math.floor(v / 65536);
          t0 = v - c * 65536;
          v = t1 + c + 65535;
          c = Math.floor(v / 65536);
          t1 = v - c * 65536;
          v = t2 + c + 65535;
          c = Math.floor(v / 65536);
          t2 = v - c * 65536;
          v = t3 + c + 65535;
          c = Math.floor(v / 65536);
          t3 = v - c * 65536;
          v = t4 + c + 65535;
          c = Math.floor(v / 65536);
          t4 = v - c * 65536;
          v = t5 + c + 65535;
          c = Math.floor(v / 65536);
          t5 = v - c * 65536;
          v = t6 + c + 65535;
          c = Math.floor(v / 65536);
          t6 = v - c * 65536;
          v = t7 + c + 65535;
          c = Math.floor(v / 65536);
          t7 = v - c * 65536;
          v = t8 + c + 65535;
          c = Math.floor(v / 65536);
          t8 = v - c * 65536;
          v = t9 + c + 65535;
          c = Math.floor(v / 65536);
          t9 = v - c * 65536;
          v = t10 + c + 65535;
          c = Math.floor(v / 65536);
          t10 = v - c * 65536;
          v = t11 + c + 65535;
          c = Math.floor(v / 65536);
          t11 = v - c * 65536;
          v = t12 + c + 65535;
          c = Math.floor(v / 65536);
          t12 = v - c * 65536;
          v = t13 + c + 65535;
          c = Math.floor(v / 65536);
          t13 = v - c * 65536;
          v = t14 + c + 65535;
          c = Math.floor(v / 65536);
          t14 = v - c * 65536;
          v = t15 + c + 65535;
          c = Math.floor(v / 65536);
          t15 = v - c * 65536;
          t0 += c - 1 + 37 * (c - 1);
          o[0] = t0;
          o[1] = t1;
          o[2] = t2;
          o[3] = t3;
          o[4] = t4;
          o[5] = t5;
          o[6] = t6;
          o[7] = t7;
          o[8] = t8;
          o[9] = t9;
          o[10] = t10;
          o[11] = t11;
          o[12] = t12;
          o[13] = t13;
          o[14] = t14;
          o[15] = t15;
        }
        function S(o, a) {
          M(o, a, a);
        }
        function inv25519(o, i) {
          var c = gf();
          var a;
          for (a = 0; a < 16; a++) c[a] = i[a];
          for (a = 253; a >= 0; a--) {
            S(c, c);
            if (a !== 2 && a !== 4) M(c, c, i);
          }
          for (a = 0; a < 16; a++) o[a] = c[a];
        }
        function pow2523(o, i) {
          var c = gf();
          var a;
          for (a = 0; a < 16; a++) c[a] = i[a];
          for (a = 250; a >= 0; a--) {
            S(c, c);
            if (a !== 1) M(c, c, i);
          }
          for (a = 0; a < 16; a++) o[a] = c[a];
        }
        function crypto_scalarmult(q, n, p) {
          var z = new Uint8Array(32);
          var x = new Float64Array(80), r, i;
          var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf();
          for (i = 0; i < 31; i++) z[i] = n[i];
          z[31] = n[31] & 127 | 64;
          z[0] &= 248;
          unpack25519(x, p);
          for (i = 0; i < 16; i++) {
            b[i] = x[i];
            d[i] = a[i] = c[i] = 0;
          }
          a[0] = d[0] = 1;
          for (i = 254; i >= 0; --i) {
            r = z[i >>> 3] >>> (i & 7) & 1;
            sel25519(a, b, r);
            sel25519(c, d, r);
            A(e, a, c);
            Z(a, a, c);
            A(c, b, d);
            Z(b, b, d);
            S(d, e);
            S(f, a);
            M(a, c, a);
            M(c, b, e);
            A(e, a, c);
            Z(a, a, c);
            S(b, a);
            Z(c, d, f);
            M(a, c, _121665);
            A(a, a, d);
            M(c, c, a);
            M(a, d, f);
            M(d, b, x);
            S(b, e);
            sel25519(a, b, r);
            sel25519(c, d, r);
          }
          for (i = 0; i < 16; i++) {
            x[i + 16] = a[i];
            x[i + 32] = c[i];
            x[i + 48] = b[i];
            x[i + 64] = d[i];
          }
          var x32 = x.subarray(32);
          var x16 = x.subarray(16);
          inv25519(x32, x32);
          M(x16, x16, x32);
          pack25519(q, x16);
          return 0;
        }
        function crypto_scalarmult_base(q, n) {
          return crypto_scalarmult(q, n, _9);
        }
        function crypto_box_keypair(y, x) {
          randombytes(x, 32);
          return crypto_scalarmult_base(y, x);
        }
        function crypto_box_beforenm(k, y, x) {
          var s = new Uint8Array(32);
          crypto_scalarmult(s, x, y);
          return crypto_core_hsalsa20(k, _0, s, sigma);
        }
        var crypto_box_afternm = crypto_secretbox;
        var crypto_box_open_afternm = crypto_secretbox_open;
        function crypto_box(c, m, d, n, y, x) {
          var k = new Uint8Array(32);
          crypto_box_beforenm(k, y, x);
          return crypto_box_afternm(c, m, d, n, k);
        }
        function crypto_box_open(m, c, d, n, y, x) {
          var k = new Uint8Array(32);
          crypto_box_beforenm(k, y, x);
          return crypto_box_open_afternm(m, c, d, n, k);
        }
        var K = [
          1116352408,
          3609767458,
          1899447441,
          602891725,
          3049323471,
          3964484399,
          3921009573,
          2173295548,
          961987163,
          4081628472,
          1508970993,
          3053834265,
          2453635748,
          2937671579,
          2870763221,
          3664609560,
          3624381080,
          2734883394,
          310598401,
          1164996542,
          607225278,
          1323610764,
          1426881987,
          3590304994,
          1925078388,
          4068182383,
          2162078206,
          991336113,
          2614888103,
          633803317,
          3248222580,
          3479774868,
          3835390401,
          2666613458,
          4022224774,
          944711139,
          264347078,
          2341262773,
          604807628,
          2007800933,
          770255983,
          1495990901,
          1249150122,
          1856431235,
          1555081692,
          3175218132,
          1996064986,
          2198950837,
          2554220882,
          3999719339,
          2821834349,
          766784016,
          2952996808,
          2566594879,
          3210313671,
          3203337956,
          3336571891,
          1034457026,
          3584528711,
          2466948901,
          113926993,
          3758326383,
          338241895,
          168717936,
          666307205,
          1188179964,
          773529912,
          1546045734,
          1294757372,
          1522805485,
          1396182291,
          2643833823,
          1695183700,
          2343527390,
          1986661051,
          1014477480,
          2177026350,
          1206759142,
          2456956037,
          344077627,
          2730485921,
          1290863460,
          2820302411,
          3158454273,
          3259730800,
          3505952657,
          3345764771,
          106217008,
          3516065817,
          3606008344,
          3600352804,
          1432725776,
          4094571909,
          1467031594,
          275423344,
          851169720,
          430227734,
          3100823752,
          506948616,
          1363258195,
          659060556,
          3750685593,
          883997877,
          3785050280,
          958139571,
          3318307427,
          1322822218,
          3812723403,
          1537002063,
          2003034995,
          1747873779,
          3602036899,
          1955562222,
          1575990012,
          2024104815,
          1125592928,
          2227730452,
          2716904306,
          2361852424,
          442776044,
          2428436474,
          593698344,
          2756734187,
          3733110249,
          3204031479,
          2999351573,
          3329325298,
          3815920427,
          3391569614,
          3928383900,
          3515267271,
          566280711,
          3940187606,
          3454069534,
          4118630271,
          4000239992,
          116418474,
          1914138554,
          174292421,
          2731055270,
          289380356,
          3203993006,
          460393269,
          320620315,
          685471733,
          587496836,
          852142971,
          1086792851,
          1017036298,
          365543100,
          1126000580,
          2618297676,
          1288033470,
          3409855158,
          1501505948,
          4234509866,
          1607167915,
          987167468,
          1816402316,
          1246189591
        ];
        function crypto_hashblocks_hl(hh, hl, m, n) {
          var wh = new Int32Array(16), wl = new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
          var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
          var pos = 0;
          while (n >= 128) {
            for (i = 0; i < 16; i++) {
              j = 8 * i + pos;
              wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
              wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
            }
            for (i = 0; i < 80; i++) {
              bh0 = ah0;
              bh1 = ah1;
              bh2 = ah2;
              bh3 = ah3;
              bh4 = ah4;
              bh5 = ah5;
              bh6 = ah6;
              bh7 = ah7;
              bl0 = al0;
              bl1 = al1;
              bl2 = al2;
              bl3 = al3;
              bl4 = al4;
              bl5 = al5;
              bl6 = al6;
              bl7 = al7;
              h = ah7;
              l = al7;
              a = l & 65535;
              b = l >>> 16;
              c = h & 65535;
              d = h >>> 16;
              h = (ah4 >>> 14 | al4 << 32 - 14) ^ (ah4 >>> 18 | al4 << 32 - 18) ^ (al4 >>> 41 - 32 | ah4 << 32 - (41 - 32));
              l = (al4 >>> 14 | ah4 << 32 - 14) ^ (al4 >>> 18 | ah4 << 32 - 18) ^ (ah4 >>> 41 - 32 | al4 << 32 - (41 - 32));
              a += l & 65535;
              b += l >>> 16;
              c += h & 65535;
              d += h >>> 16;
              h = ah4 & ah5 ^ ~ah4 & ah6;
              l = al4 & al5 ^ ~al4 & al6;
              a += l & 65535;
              b += l >>> 16;
              c += h & 65535;
              d += h >>> 16;
              h = K[i * 2];
              l = K[i * 2 + 1];
              a += l & 65535;
              b += l >>> 16;
              c += h & 65535;
              d += h >>> 16;
              h = wh[i % 16];
              l = wl[i % 16];
              a += l & 65535;
              b += l >>> 16;
              c += h & 65535;
              d += h >>> 16;
              b += a >>> 16;
              c += b >>> 16;
              d += c >>> 16;
              th = c & 65535 | d << 16;
              tl = a & 65535 | b << 16;
              h = th;
              l = tl;
              a = l & 65535;
              b = l >>> 16;
              c = h & 65535;
              d = h >>> 16;
              h = (ah0 >>> 28 | al0 << 32 - 28) ^ (al0 >>> 34 - 32 | ah0 << 32 - (34 - 32)) ^ (al0 >>> 39 - 32 | ah0 << 32 - (39 - 32));
              l = (al0 >>> 28 | ah0 << 32 - 28) ^ (ah0 >>> 34 - 32 | al0 << 32 - (34 - 32)) ^ (ah0 >>> 39 - 32 | al0 << 32 - (39 - 32));
              a += l & 65535;
              b += l >>> 16;
              c += h & 65535;
              d += h >>> 16;
              h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
              l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
              a += l & 65535;
              b += l >>> 16;
              c += h & 65535;
              d += h >>> 16;
              b += a >>> 16;
              c += b >>> 16;
              d += c >>> 16;
              bh7 = c & 65535 | d << 16;
              bl7 = a & 65535 | b << 16;
              h = bh3;
              l = bl3;
              a = l & 65535;
              b = l >>> 16;
              c = h & 65535;
              d = h >>> 16;
              h = th;
              l = tl;
              a += l & 65535;
              b += l >>> 16;
              c += h & 65535;
              d += h >>> 16;
              b += a >>> 16;
              c += b >>> 16;
              d += c >>> 16;
              bh3 = c & 65535 | d << 16;
              bl3 = a & 65535 | b << 16;
              ah1 = bh0;
              ah2 = bh1;
              ah3 = bh2;
              ah4 = bh3;
              ah5 = bh4;
              ah6 = bh5;
              ah7 = bh6;
              ah0 = bh7;
              al1 = bl0;
              al2 = bl1;
              al3 = bl2;
              al4 = bl3;
              al5 = bl4;
              al6 = bl5;
              al7 = bl6;
              al0 = bl7;
              if (i % 16 === 15) {
                for (j = 0; j < 16; j++) {
                  h = wh[j];
                  l = wl[j];
                  a = l & 65535;
                  b = l >>> 16;
                  c = h & 65535;
                  d = h >>> 16;
                  h = wh[(j + 9) % 16];
                  l = wl[(j + 9) % 16];
                  a += l & 65535;
                  b += l >>> 16;
                  c += h & 65535;
                  d += h >>> 16;
                  th = wh[(j + 1) % 16];
                  tl = wl[(j + 1) % 16];
                  h = (th >>> 1 | tl << 32 - 1) ^ (th >>> 8 | tl << 32 - 8) ^ th >>> 7;
                  l = (tl >>> 1 | th << 32 - 1) ^ (tl >>> 8 | th << 32 - 8) ^ (tl >>> 7 | th << 32 - 7);
                  a += l & 65535;
                  b += l >>> 16;
                  c += h & 65535;
                  d += h >>> 16;
                  th = wh[(j + 14) % 16];
                  tl = wl[(j + 14) % 16];
                  h = (th >>> 19 | tl << 32 - 19) ^ (tl >>> 61 - 32 | th << 32 - (61 - 32)) ^ th >>> 6;
                  l = (tl >>> 19 | th << 32 - 19) ^ (th >>> 61 - 32 | tl << 32 - (61 - 32)) ^ (tl >>> 6 | th << 32 - 6);
                  a += l & 65535;
                  b += l >>> 16;
                  c += h & 65535;
                  d += h >>> 16;
                  b += a >>> 16;
                  c += b >>> 16;
                  d += c >>> 16;
                  wh[j] = c & 65535 | d << 16;
                  wl[j] = a & 65535 | b << 16;
                }
              }
            }
            h = ah0;
            l = al0;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[0];
            l = hl[0];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[0] = ah0 = c & 65535 | d << 16;
            hl[0] = al0 = a & 65535 | b << 16;
            h = ah1;
            l = al1;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[1];
            l = hl[1];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[1] = ah1 = c & 65535 | d << 16;
            hl[1] = al1 = a & 65535 | b << 16;
            h = ah2;
            l = al2;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[2];
            l = hl[2];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[2] = ah2 = c & 65535 | d << 16;
            hl[2] = al2 = a & 65535 | b << 16;
            h = ah3;
            l = al3;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[3];
            l = hl[3];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[3] = ah3 = c & 65535 | d << 16;
            hl[3] = al3 = a & 65535 | b << 16;
            h = ah4;
            l = al4;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[4];
            l = hl[4];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[4] = ah4 = c & 65535 | d << 16;
            hl[4] = al4 = a & 65535 | b << 16;
            h = ah5;
            l = al5;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[5];
            l = hl[5];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[5] = ah5 = c & 65535 | d << 16;
            hl[5] = al5 = a & 65535 | b << 16;
            h = ah6;
            l = al6;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[6];
            l = hl[6];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[6] = ah6 = c & 65535 | d << 16;
            hl[6] = al6 = a & 65535 | b << 16;
            h = ah7;
            l = al7;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[7];
            l = hl[7];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[7] = ah7 = c & 65535 | d << 16;
            hl[7] = al7 = a & 65535 | b << 16;
            pos += 128;
            n -= 128;
          }
          return n;
        }
        function crypto_hash(out, m, n) {
          var hh = new Int32Array(8), hl = new Int32Array(8), x = new Uint8Array(256), i, b = n;
          hh[0] = 1779033703;
          hh[1] = 3144134277;
          hh[2] = 1013904242;
          hh[3] = 2773480762;
          hh[4] = 1359893119;
          hh[5] = 2600822924;
          hh[6] = 528734635;
          hh[7] = 1541459225;
          hl[0] = 4089235720;
          hl[1] = 2227873595;
          hl[2] = 4271175723;
          hl[3] = 1595750129;
          hl[4] = 2917565137;
          hl[5] = 725511199;
          hl[6] = 4215389547;
          hl[7] = 327033209;
          crypto_hashblocks_hl(hh, hl, m, n);
          n %= 128;
          for (i = 0; i < n; i++) x[i] = m[b - n + i];
          x[n] = 128;
          n = 256 - 128 * (n < 112 ? 1 : 0);
          x[n - 9] = 0;
          ts64(x, n - 8, b / 536870912 | 0, b << 3);
          crypto_hashblocks_hl(hh, hl, x, n);
          for (i = 0; i < 8; i++) ts64(out, 8 * i, hh[i], hl[i]);
          return 0;
        }
        function add2(p, q) {
          var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
          Z(a, p[1], p[0]);
          Z(t, q[1], q[0]);
          M(a, a, t);
          A(b, p[0], p[1]);
          A(t, q[0], q[1]);
          M(b, b, t);
          M(c, p[3], q[3]);
          M(c, c, D2);
          M(d, p[2], q[2]);
          A(d, d, d);
          Z(e, b, a);
          Z(f, d, c);
          A(g, d, c);
          A(h, b, a);
          M(p[0], e, f);
          M(p[1], h, g);
          M(p[2], g, f);
          M(p[3], e, h);
        }
        function cswap(p, q, b) {
          var i;
          for (i = 0; i < 4; i++) {
            sel25519(p[i], q[i], b);
          }
        }
        function pack(r, p) {
          var tx = gf(), ty = gf(), zi = gf();
          inv25519(zi, p[2]);
          M(tx, p[0], zi);
          M(ty, p[1], zi);
          pack25519(r, ty);
          r[31] ^= par25519(tx) << 7;
        }
        function scalarmult(p, q, s) {
          var b, i;
          set25519(p[0], gf0);
          set25519(p[1], gf1);
          set25519(p[2], gf1);
          set25519(p[3], gf0);
          for (i = 255; i >= 0; --i) {
            b = s[i / 8 | 0] >> (i & 7) & 1;
            cswap(p, q, b);
            add2(q, p);
            add2(p, p);
            cswap(p, q, b);
          }
        }
        function scalarbase(p, s) {
          var q = [gf(), gf(), gf(), gf()];
          set25519(q[0], X);
          set25519(q[1], Y);
          set25519(q[2], gf1);
          M(q[3], X, Y);
          scalarmult(p, q, s);
        }
        function crypto_sign_keypair(pk, sk, seeded) {
          var d = new Uint8Array(64);
          var p = [gf(), gf(), gf(), gf()];
          var i;
          if (!seeded) randombytes(sk, 32);
          crypto_hash(d, sk, 32);
          d[0] &= 248;
          d[31] &= 127;
          d[31] |= 64;
          scalarbase(p, d);
          pack(pk, p);
          for (i = 0; i < 32; i++) sk[i + 32] = pk[i];
          return 0;
        }
        var L = new Float64Array([237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249, 222, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16]);
        function modL(r, x) {
          var carry, i, j, k;
          for (i = 63; i >= 32; --i) {
            carry = 0;
            for (j = i - 32, k = i - 12; j < k; ++j) {
              x[j] += carry - 16 * x[i] * L[j - (i - 32)];
              carry = Math.floor((x[j] + 128) / 256);
              x[j] -= carry * 256;
            }
            x[j] += carry;
            x[i] = 0;
          }
          carry = 0;
          for (j = 0; j < 32; j++) {
            x[j] += carry - (x[31] >> 4) * L[j];
            carry = x[j] >> 8;
            x[j] &= 255;
          }
          for (j = 0; j < 32; j++) x[j] -= carry * L[j];
          for (i = 0; i < 32; i++) {
            x[i + 1] += x[i] >> 8;
            r[i] = x[i] & 255;
          }
        }
        function reduce(r) {
          var x = new Float64Array(64), i;
          for (i = 0; i < 64; i++) x[i] = r[i];
          for (i = 0; i < 64; i++) r[i] = 0;
          modL(r, x);
        }
        function crypto_sign(sm, m, n, sk) {
          var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
          var i, j, x = new Float64Array(64);
          var p = [gf(), gf(), gf(), gf()];
          crypto_hash(d, sk, 32);
          d[0] &= 248;
          d[31] &= 127;
          d[31] |= 64;
          var smlen = n + 64;
          for (i = 0; i < n; i++) sm[64 + i] = m[i];
          for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];
          crypto_hash(r, sm.subarray(32), n + 32);
          reduce(r);
          scalarbase(p, r);
          pack(sm, p);
          for (i = 32; i < 64; i++) sm[i] = sk[i];
          crypto_hash(h, sm, n + 64);
          reduce(h);
          for (i = 0; i < 64; i++) x[i] = 0;
          for (i = 0; i < 32; i++) x[i] = r[i];
          for (i = 0; i < 32; i++) {
            for (j = 0; j < 32; j++) {
              x[i + j] += h[i] * d[j];
            }
          }
          modL(sm.subarray(32), x);
          return smlen;
        }
        function unpackneg(r, p) {
          var t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
          set25519(r[2], gf1);
          unpack25519(r[1], p);
          S(num, r[1]);
          M(den, num, D);
          Z(num, num, r[2]);
          A(den, r[2], den);
          S(den2, den);
          S(den4, den2);
          M(den6, den4, den2);
          M(t, den6, num);
          M(t, t, den);
          pow2523(t, t);
          M(t, t, num);
          M(t, t, den);
          M(t, t, den);
          M(r[0], t, den);
          S(chk, r[0]);
          M(chk, chk, den);
          if (neq25519(chk, num)) M(r[0], r[0], I);
          S(chk, r[0]);
          M(chk, chk, den);
          if (neq25519(chk, num)) return -1;
          if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
          M(r[3], r[0], r[1]);
          return 0;
        }
        function crypto_sign_open(m, sm, n, pk) {
          var i;
          var t = new Uint8Array(32), h = new Uint8Array(64);
          var p = [gf(), gf(), gf(), gf()], q = [gf(), gf(), gf(), gf()];
          if (n < 64) return -1;
          if (unpackneg(q, pk)) return -1;
          for (i = 0; i < n; i++) m[i] = sm[i];
          for (i = 0; i < 32; i++) m[i + 32] = pk[i];
          crypto_hash(h, m, n);
          reduce(h);
          scalarmult(p, q, h);
          scalarbase(q, sm.subarray(32));
          add2(p, q);
          pack(t, p);
          n -= 64;
          if (crypto_verify_32(sm, 0, t, 0)) {
            for (i = 0; i < n; i++) m[i] = 0;
            return -1;
          }
          for (i = 0; i < n; i++) m[i] = sm[i + 64];
          return n;
        }
        var crypto_secretbox_KEYBYTES = 32, crypto_secretbox_NONCEBYTES = 24, crypto_secretbox_ZEROBYTES = 32, crypto_secretbox_BOXZEROBYTES = 16, crypto_scalarmult_BYTES = 32, crypto_scalarmult_SCALARBYTES = 32, crypto_box_PUBLICKEYBYTES = 32, crypto_box_SECRETKEYBYTES = 32, crypto_box_BEFORENMBYTES = 32, crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES, crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES, crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES, crypto_sign_BYTES = 64, crypto_sign_PUBLICKEYBYTES = 32, crypto_sign_SECRETKEYBYTES = 64, crypto_sign_SEEDBYTES = 32, crypto_hash_BYTES = 64;
        nacl7.lowlevel = {
          crypto_core_hsalsa20,
          crypto_stream_xor,
          crypto_stream,
          crypto_stream_salsa20_xor,
          crypto_stream_salsa20,
          crypto_onetimeauth,
          crypto_onetimeauth_verify,
          crypto_verify_16,
          crypto_verify_32,
          crypto_secretbox,
          crypto_secretbox_open,
          crypto_scalarmult,
          crypto_scalarmult_base,
          crypto_box_beforenm,
          crypto_box_afternm,
          crypto_box,
          crypto_box_open,
          crypto_box_keypair,
          crypto_hash,
          crypto_sign,
          crypto_sign_keypair,
          crypto_sign_open,
          crypto_secretbox_KEYBYTES,
          crypto_secretbox_NONCEBYTES,
          crypto_secretbox_ZEROBYTES,
          crypto_secretbox_BOXZEROBYTES,
          crypto_scalarmult_BYTES,
          crypto_scalarmult_SCALARBYTES,
          crypto_box_PUBLICKEYBYTES,
          crypto_box_SECRETKEYBYTES,
          crypto_box_BEFORENMBYTES,
          crypto_box_NONCEBYTES,
          crypto_box_ZEROBYTES,
          crypto_box_BOXZEROBYTES,
          crypto_sign_BYTES,
          crypto_sign_PUBLICKEYBYTES,
          crypto_sign_SECRETKEYBYTES,
          crypto_sign_SEEDBYTES,
          crypto_hash_BYTES,
          gf,
          D,
          L,
          pack25519,
          unpack25519,
          M,
          A,
          S,
          Z,
          pow2523,
          add: add2,
          set25519,
          modL,
          scalarmult,
          scalarbase
        };
        function checkLengths(k, n) {
          if (k.length !== crypto_secretbox_KEYBYTES) throw new Error("bad key size");
          if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error("bad nonce size");
        }
        function checkBoxLengths(pk, sk) {
          if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error("bad public key size");
          if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error("bad secret key size");
        }
        function checkArrayTypes() {
          for (var i = 0; i < arguments.length; i++) {
            if (!(arguments[i] instanceof Uint8Array))
              throw new TypeError("unexpected type, use Uint8Array");
          }
        }
        function cleanup(arr) {
          for (var i = 0; i < arr.length; i++) arr[i] = 0;
        }
        nacl7.randomBytes = function(n) {
          var b = new Uint8Array(n);
          randombytes(b, n);
          return b;
        };
        nacl7.secretbox = function(msg, nonce, key) {
          checkArrayTypes(msg, nonce, key);
          checkLengths(key, nonce);
          var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
          var c = new Uint8Array(m.length);
          for (var i = 0; i < msg.length; i++) m[i + crypto_secretbox_ZEROBYTES] = msg[i];
          crypto_secretbox(c, m, m.length, nonce, key);
          return c.subarray(crypto_secretbox_BOXZEROBYTES);
        };
        nacl7.secretbox.open = function(box, nonce, key) {
          checkArrayTypes(box, nonce, key);
          checkLengths(key, nonce);
          var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
          var m = new Uint8Array(c.length);
          for (var i = 0; i < box.length; i++) c[i + crypto_secretbox_BOXZEROBYTES] = box[i];
          if (c.length < 32) return null;
          if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
          return m.subarray(crypto_secretbox_ZEROBYTES);
        };
        nacl7.secretbox.keyLength = crypto_secretbox_KEYBYTES;
        nacl7.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
        nacl7.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
        nacl7.scalarMult = function(n, p) {
          checkArrayTypes(n, p);
          if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
          if (p.length !== crypto_scalarmult_BYTES) throw new Error("bad p size");
          var q = new Uint8Array(crypto_scalarmult_BYTES);
          crypto_scalarmult(q, n, p);
          return q;
        };
        nacl7.scalarMult.base = function(n) {
          checkArrayTypes(n);
          if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
          var q = new Uint8Array(crypto_scalarmult_BYTES);
          crypto_scalarmult_base(q, n);
          return q;
        };
        nacl7.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
        nacl7.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
        nacl7.box = function(msg, nonce, publicKey, secretKey) {
          var k = nacl7.box.before(publicKey, secretKey);
          return nacl7.secretbox(msg, nonce, k);
        };
        nacl7.box.before = function(publicKey, secretKey) {
          checkArrayTypes(publicKey, secretKey);
          checkBoxLengths(publicKey, secretKey);
          var k = new Uint8Array(crypto_box_BEFORENMBYTES);
          crypto_box_beforenm(k, publicKey, secretKey);
          return k;
        };
        nacl7.box.after = nacl7.secretbox;
        nacl7.box.open = function(msg, nonce, publicKey, secretKey) {
          var k = nacl7.box.before(publicKey, secretKey);
          return nacl7.secretbox.open(msg, nonce, k);
        };
        nacl7.box.open.after = nacl7.secretbox.open;
        nacl7.box.keyPair = function() {
          var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
          var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
          crypto_box_keypair(pk, sk);
          return { publicKey: pk, secretKey: sk };
        };
        nacl7.box.keyPair.fromSecretKey = function(secretKey) {
          checkArrayTypes(secretKey);
          if (secretKey.length !== crypto_box_SECRETKEYBYTES)
            throw new Error("bad secret key size");
          var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
          crypto_scalarmult_base(pk, secretKey);
          return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
        };
        nacl7.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
        nacl7.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
        nacl7.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
        nacl7.box.nonceLength = crypto_box_NONCEBYTES;
        nacl7.box.overheadLength = nacl7.secretbox.overheadLength;
        nacl7.sign = function(msg, secretKey) {
          checkArrayTypes(msg, secretKey);
          if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
            throw new Error("bad secret key size");
          var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
          crypto_sign(signedMsg, msg, msg.length, secretKey);
          return signedMsg;
        };
        nacl7.sign.open = function(signedMsg, publicKey) {
          checkArrayTypes(signedMsg, publicKey);
          if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
            throw new Error("bad public key size");
          var tmp = new Uint8Array(signedMsg.length);
          var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
          if (mlen < 0) return null;
          var m = new Uint8Array(mlen);
          for (var i = 0; i < m.length; i++) m[i] = tmp[i];
          return m;
        };
        nacl7.sign.detached = function(msg, secretKey) {
          var signedMsg = nacl7.sign(msg, secretKey);
          var sig = new Uint8Array(crypto_sign_BYTES);
          for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
          return sig;
        };
        nacl7.sign.detached.verify = function(msg, sig, publicKey) {
          checkArrayTypes(msg, sig, publicKey);
          if (sig.length !== crypto_sign_BYTES)
            throw new Error("bad signature size");
          if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
            throw new Error("bad public key size");
          var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
          var m = new Uint8Array(crypto_sign_BYTES + msg.length);
          var i;
          for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
          for (i = 0; i < msg.length; i++) sm[i + crypto_sign_BYTES] = msg[i];
          return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
        };
        nacl7.sign.keyPair = function() {
          var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
          var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
          crypto_sign_keypair(pk, sk);
          return { publicKey: pk, secretKey: sk };
        };
        nacl7.sign.keyPair.fromSecretKey = function(secretKey) {
          checkArrayTypes(secretKey);
          if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
            throw new Error("bad secret key size");
          var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
          for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32 + i];
          return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
        };
        nacl7.sign.keyPair.fromSeed = function(seed) {
          checkArrayTypes(seed);
          if (seed.length !== crypto_sign_SEEDBYTES)
            throw new Error("bad seed size");
          var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
          var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
          for (var i = 0; i < 32; i++) sk[i] = seed[i];
          crypto_sign_keypair(pk, sk, true);
          return { publicKey: pk, secretKey: sk };
        };
        nacl7.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
        nacl7.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
        nacl7.sign.seedLength = crypto_sign_SEEDBYTES;
        nacl7.sign.signatureLength = crypto_sign_BYTES;
        nacl7.hash = function(msg) {
          checkArrayTypes(msg);
          var h = new Uint8Array(crypto_hash_BYTES);
          crypto_hash(h, msg, msg.length);
          return h;
        };
        nacl7.hash.hashLength = crypto_hash_BYTES;
        nacl7.verify = function(x, y) {
          checkArrayTypes(x, y);
          if (x.length === 0 || y.length === 0) return false;
          if (x.length !== y.length) return false;
          return vn(x, 0, y, 0, x.length) === 0 ? true : false;
        };
        nacl7.setPRNG = function(fn) {
          randombytes = fn;
        };
        (function() {
          var crypto2 = typeof self !== "undefined" ? self.crypto || self.msCrypto : null;
          if (crypto2 && crypto2.getRandomValues) {
            var QUOTA = 65536;
            nacl7.setPRNG(function(x, n) {
              var i, v = new Uint8Array(n);
              for (i = 0; i < n; i += QUOTA) {
                crypto2.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
              }
              for (i = 0; i < n; i++) x[i] = v[i];
              cleanup(v);
            });
          } else if (typeof __require !== "undefined") {
            crypto2 = require_crypto();
            if (crypto2 && crypto2.randomBytes) {
              nacl7.setPRNG(function(x, n) {
                var i, v = crypto2.randomBytes(n);
                for (i = 0; i < n; i++) x[i] = v[i];
                cleanup(v);
              });
            }
          }
        })();
      })(typeof module !== "undefined" && module.exports ? module.exports : self.nacl = self.nacl || {});
    }
  });

  // node_modules/@noble/hashes/crypto.js
  var require_crypto2 = __commonJS({
    "node_modules/@noble/hashes/crypto.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.crypto = void 0;
      exports.crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
    }
  });

  // node_modules/@noble/hashes/utils.js
  var require_utils = __commonJS({
    "node_modules/@noble/hashes/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.wrapXOFConstructorWithOpts = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.Hash = exports.nextTick = exports.swap32IfBE = exports.byteSwapIfBE = exports.swap8IfBE = exports.isLE = void 0;
      exports.isBytes = isBytes3;
      exports.anumber = anumber3;
      exports.abytes = abytes3;
      exports.ahash = ahash;
      exports.aexists = aexists3;
      exports.aoutput = aoutput3;
      exports.u8 = u82;
      exports.u32 = u323;
      exports.clean = clean3;
      exports.createView = createView3;
      exports.rotr = rotr2;
      exports.rotl = rotl2;
      exports.byteSwap = byteSwap2;
      exports.byteSwap32 = byteSwap322;
      exports.bytesToHex = bytesToHex3;
      exports.hexToBytes = hexToBytes2;
      exports.asyncLoop = asyncLoop;
      exports.utf8ToBytes = utf8ToBytes;
      exports.bytesToUtf8 = bytesToUtf8;
      exports.toBytes = toBytes;
      exports.kdfInputToBytes = kdfInputToBytes;
      exports.concatBytes = concatBytes5;
      exports.checkOpts = checkOpts2;
      exports.createHasher = createHasher2;
      exports.createOptHasher = createOptHasher;
      exports.createXOFer = createXOFer;
      exports.randomBytes = randomBytes3;
      var crypto_1 = require_crypto2();
      function isBytes3(a) {
        return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
      }
      function anumber3(n) {
        if (!Number.isSafeInteger(n) || n < 0)
          throw new Error("positive integer expected, got " + n);
      }
      function abytes3(b, ...lengths) {
        if (!isBytes3(b))
          throw new Error("Uint8Array expected");
        if (lengths.length > 0 && !lengths.includes(b.length))
          throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
      }
      function ahash(h) {
        if (typeof h !== "function" || typeof h.create !== "function")
          throw new Error("Hash should be wrapped by utils.createHasher");
        anumber3(h.outputLen);
        anumber3(h.blockLen);
      }
      function aexists3(instance, checkFinished = true) {
        if (instance.destroyed)
          throw new Error("Hash instance has been destroyed");
        if (checkFinished && instance.finished)
          throw new Error("Hash#digest() has already been called");
      }
      function aoutput3(out, instance) {
        abytes3(out);
        const min = instance.outputLen;
        if (out.length < min) {
          throw new Error("digestInto() expects output buffer of length at least " + min);
        }
      }
      function u82(arr) {
        return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      }
      function u323(arr) {
        return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
      }
      function clean3(...arrays) {
        for (let i = 0; i < arrays.length; i++) {
          arrays[i].fill(0);
        }
      }
      function createView3(arr) {
        return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
      }
      function rotr2(word, shift) {
        return word << 32 - shift | word >>> shift;
      }
      function rotl2(word, shift) {
        return word << shift | word >>> 32 - shift >>> 0;
      }
      exports.isLE = (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
      function byteSwap2(word) {
        return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
      }
      exports.swap8IfBE = exports.isLE ? (n) => n : (n) => byteSwap2(n);
      exports.byteSwapIfBE = exports.swap8IfBE;
      function byteSwap322(arr) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = byteSwap2(arr[i]);
        }
        return arr;
      }
      exports.swap32IfBE = exports.isLE ? (u) => u : byteSwap322;
      var hasHexBuiltin2 = /* @__PURE__ */ (() => (
        // @ts-ignore
        typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
      ))();
      var hexes2 = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
      function bytesToHex3(bytes) {
        abytes3(bytes);
        if (hasHexBuiltin2)
          return bytes.toHex();
        let hex3 = "";
        for (let i = 0; i < bytes.length; i++) {
          hex3 += hexes2[bytes[i]];
        }
        return hex3;
      }
      var asciis2 = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
      function asciiToBase162(ch) {
        if (ch >= asciis2._0 && ch <= asciis2._9)
          return ch - asciis2._0;
        if (ch >= asciis2.A && ch <= asciis2.F)
          return ch - (asciis2.A - 10);
        if (ch >= asciis2.a && ch <= asciis2.f)
          return ch - (asciis2.a - 10);
        return;
      }
      function hexToBytes2(hex3) {
        if (typeof hex3 !== "string")
          throw new Error("hex string expected, got " + typeof hex3);
        if (hasHexBuiltin2)
          return Uint8Array.fromHex(hex3);
        const hl = hex3.length;
        const al = hl / 2;
        if (hl % 2)
          throw new Error("hex string expected, got unpadded hex of length " + hl);
        const array = new Uint8Array(al);
        for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
          const n1 = asciiToBase162(hex3.charCodeAt(hi));
          const n2 = asciiToBase162(hex3.charCodeAt(hi + 1));
          if (n1 === void 0 || n2 === void 0) {
            const char = hex3[hi] + hex3[hi + 1];
            throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
          }
          array[ai] = n1 * 16 + n2;
        }
        return array;
      }
      var nextTick = async () => {
      };
      exports.nextTick = nextTick;
      async function asyncLoop(iters, tick, cb) {
        let ts = Date.now();
        for (let i = 0; i < iters; i++) {
          cb(i);
          const diff = Date.now() - ts;
          if (diff >= 0 && diff < tick)
            continue;
          await (0, exports.nextTick)();
          ts += diff;
        }
      }
      function utf8ToBytes(str) {
        if (typeof str !== "string")
          throw new Error("string expected");
        return new Uint8Array(new TextEncoder().encode(str));
      }
      function bytesToUtf8(bytes) {
        return new TextDecoder().decode(bytes);
      }
      function toBytes(data) {
        if (typeof data === "string")
          data = utf8ToBytes(data);
        abytes3(data);
        return data;
      }
      function kdfInputToBytes(data) {
        if (typeof data === "string")
          data = utf8ToBytes(data);
        abytes3(data);
        return data;
      }
      function concatBytes5(...arrays) {
        let sum = 0;
        for (let i = 0; i < arrays.length; i++) {
          const a = arrays[i];
          abytes3(a);
          sum += a.length;
        }
        const res = new Uint8Array(sum);
        for (let i = 0, pad2 = 0; i < arrays.length; i++) {
          const a = arrays[i];
          res.set(a, pad2);
          pad2 += a.length;
        }
        return res;
      }
      function checkOpts2(defaults, opts) {
        if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
          throw new Error("options should be object or undefined");
        const merged = Object.assign(defaults, opts);
        return merged;
      }
      var Hash = class {
      };
      exports.Hash = Hash;
      function createHasher2(hashCons) {
        const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
        const tmp = hashCons();
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = () => hashCons();
        return hashC;
      }
      function createOptHasher(hashCons) {
        const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
        const tmp = hashCons({});
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = (opts) => hashCons(opts);
        return hashC;
      }
      function createXOFer(hashCons) {
        const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
        const tmp = hashCons({});
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = (opts) => hashCons(opts);
        return hashC;
      }
      exports.wrapConstructor = createHasher2;
      exports.wrapConstructorWithOpts = createOptHasher;
      exports.wrapXOFConstructorWithOpts = createXOFer;
      function randomBytes3(bytesLength = 32) {
        if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") {
          return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
        }
        if (crypto_1.crypto && typeof crypto_1.crypto.randomBytes === "function") {
          return Uint8Array.from(crypto_1.crypto.randomBytes(bytesLength));
        }
        throw new Error("crypto.getRandomValues must be defined");
      }
    }
  });

  // node_modules/@noble/hashes/_md.js
  var require_md = __commonJS({
    "node_modules/@noble/hashes/_md.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SHA512_IV = exports.SHA384_IV = exports.SHA224_IV = exports.SHA256_IV = exports.HashMD = void 0;
      exports.setBigUint64 = setBigUint64;
      exports.Chi = Chi2;
      exports.Maj = Maj2;
      var utils_ts_1 = require_utils();
      function setBigUint64(view, byteOffset, value, isLE3) {
        if (typeof view.setBigUint64 === "function")
          return view.setBigUint64(byteOffset, value, isLE3);
        const _32n2 = BigInt(32);
        const _u32_max = BigInt(4294967295);
        const wh = Number(value >> _32n2 & _u32_max);
        const wl = Number(value & _u32_max);
        const h = isLE3 ? 4 : 0;
        const l = isLE3 ? 0 : 4;
        view.setUint32(byteOffset + h, wh, isLE3);
        view.setUint32(byteOffset + l, wl, isLE3);
      }
      function Chi2(a, b, c) {
        return a & b ^ ~a & c;
      }
      function Maj2(a, b, c) {
        return a & b ^ a & c ^ b & c;
      }
      var HashMD2 = class extends utils_ts_1.Hash {
        constructor(blockLen, outputLen, padOffset, isLE3) {
          super();
          this.finished = false;
          this.length = 0;
          this.pos = 0;
          this.destroyed = false;
          this.blockLen = blockLen;
          this.outputLen = outputLen;
          this.padOffset = padOffset;
          this.isLE = isLE3;
          this.buffer = new Uint8Array(blockLen);
          this.view = (0, utils_ts_1.createView)(this.buffer);
        }
        update(data) {
          (0, utils_ts_1.aexists)(this);
          data = (0, utils_ts_1.toBytes)(data);
          (0, utils_ts_1.abytes)(data);
          const { view, buffer, blockLen } = this;
          const len = data.length;
          for (let pos = 0; pos < len; ) {
            const take = Math.min(blockLen - this.pos, len - pos);
            if (take === blockLen) {
              const dataView = (0, utils_ts_1.createView)(data);
              for (; blockLen <= len - pos; pos += blockLen)
                this.process(dataView, pos);
              continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
              this.process(view, 0);
              this.pos = 0;
            }
          }
          this.length += data.length;
          this.roundClean();
          return this;
        }
        digestInto(out) {
          (0, utils_ts_1.aexists)(this);
          (0, utils_ts_1.aoutput)(out, this);
          this.finished = true;
          const { buffer, view, blockLen, isLE: isLE3 } = this;
          let { pos } = this;
          buffer[pos++] = 128;
          (0, utils_ts_1.clean)(this.buffer.subarray(pos));
          if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
          }
          for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
          setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE3);
          this.process(view, 0);
          const oview = (0, utils_ts_1.createView)(out);
          const len = this.outputLen;
          if (len % 4)
            throw new Error("_sha2: outputLen should be aligned to 32bit");
          const outLen = len / 4;
          const state = this.get();
          if (outLen > state.length)
            throw new Error("_sha2: outputLen bigger than state");
          for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE3);
        }
        digest() {
          const { buffer, outputLen } = this;
          this.digestInto(buffer);
          const res = buffer.slice(0, outputLen);
          this.destroy();
          return res;
        }
        _cloneInto(to) {
          to || (to = new this.constructor());
          to.set(...this.get());
          const { blockLen, buffer, length, finished, destroyed, pos } = this;
          to.destroyed = destroyed;
          to.finished = finished;
          to.length = length;
          to.pos = pos;
          if (length % blockLen)
            to.buffer.set(buffer);
          return to;
        }
        clone() {
          return this._cloneInto();
        }
      };
      exports.HashMD = HashMD2;
      exports.SHA256_IV = Uint32Array.from([
        1779033703,
        3144134277,
        1013904242,
        2773480762,
        1359893119,
        2600822924,
        528734635,
        1541459225
      ]);
      exports.SHA224_IV = Uint32Array.from([
        3238371032,
        914150663,
        812702999,
        4144912697,
        4290775857,
        1750603025,
        1694076839,
        3204075428
      ]);
      exports.SHA384_IV = Uint32Array.from([
        3418070365,
        3238371032,
        1654270250,
        914150663,
        2438529370,
        812702999,
        355462360,
        4144912697,
        1731405415,
        4290775857,
        2394180231,
        1750603025,
        3675008525,
        1694076839,
        1203062813,
        3204075428
      ]);
      exports.SHA512_IV = Uint32Array.from([
        1779033703,
        4089235720,
        3144134277,
        2227873595,
        1013904242,
        4271175723,
        2773480762,
        1595750129,
        1359893119,
        2917565137,
        2600822924,
        725511199,
        528734635,
        4215389547,
        1541459225,
        327033209
      ]);
    }
  });

  // node_modules/@noble/hashes/_u64.js
  var require_u64 = __commonJS({
    "node_modules/@noble/hashes/_u64.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toBig = exports.shrSL = exports.shrSH = exports.rotrSL = exports.rotrSH = exports.rotrBL = exports.rotrBH = exports.rotr32L = exports.rotr32H = exports.rotlSL = exports.rotlSH = exports.rotlBL = exports.rotlBH = exports.add5L = exports.add5H = exports.add4L = exports.add4H = exports.add3L = exports.add3H = void 0;
      exports.add = add2;
      exports.fromBig = fromBig2;
      exports.split = split2;
      var U32_MASK642 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
      var _32n2 = /* @__PURE__ */ BigInt(32);
      function fromBig2(n, le = false) {
        if (le)
          return { h: Number(n & U32_MASK642), l: Number(n >> _32n2 & U32_MASK642) };
        return { h: Number(n >> _32n2 & U32_MASK642) | 0, l: Number(n & U32_MASK642) | 0 };
      }
      function split2(lst, le = false) {
        const len = lst.length;
        let Ah = new Uint32Array(len);
        let Al = new Uint32Array(len);
        for (let i = 0; i < len; i++) {
          const { h, l } = fromBig2(lst[i], le);
          [Ah[i], Al[i]] = [h, l];
        }
        return [Ah, Al];
      }
      var toBig = (h, l) => BigInt(h >>> 0) << _32n2 | BigInt(l >>> 0);
      exports.toBig = toBig;
      var shrSH2 = (h, _l, s) => h >>> s;
      exports.shrSH = shrSH2;
      var shrSL2 = (h, l, s) => h << 32 - s | l >>> s;
      exports.shrSL = shrSL2;
      var rotrSH2 = (h, l, s) => h >>> s | l << 32 - s;
      exports.rotrSH = rotrSH2;
      var rotrSL2 = (h, l, s) => h << 32 - s | l >>> s;
      exports.rotrSL = rotrSL2;
      var rotrBH2 = (h, l, s) => h << 64 - s | l >>> s - 32;
      exports.rotrBH = rotrBH2;
      var rotrBL2 = (h, l, s) => h >>> s - 32 | l << 64 - s;
      exports.rotrBL = rotrBL2;
      var rotr32H = (_h, l) => l;
      exports.rotr32H = rotr32H;
      var rotr32L = (h, _l) => h;
      exports.rotr32L = rotr32L;
      var rotlSH2 = (h, l, s) => h << s | l >>> 32 - s;
      exports.rotlSH = rotlSH2;
      var rotlSL2 = (h, l, s) => l << s | h >>> 32 - s;
      exports.rotlSL = rotlSL2;
      var rotlBH2 = (h, l, s) => l << s - 32 | h >>> 64 - s;
      exports.rotlBH = rotlBH2;
      var rotlBL2 = (h, l, s) => h << s - 32 | l >>> 64 - s;
      exports.rotlBL = rotlBL2;
      function add2(Ah, Al, Bh, Bl) {
        const l = (Al >>> 0) + (Bl >>> 0);
        return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
      }
      var add3L2 = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
      exports.add3L = add3L2;
      var add3H2 = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
      exports.add3H = add3H2;
      var add4L2 = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
      exports.add4L = add4L2;
      var add4H2 = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
      exports.add4H = add4H2;
      var add5L2 = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
      exports.add5L = add5L2;
      var add5H2 = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
      exports.add5H = add5H2;
      var u64 = {
        fromBig: fromBig2,
        split: split2,
        toBig,
        shrSH: shrSH2,
        shrSL: shrSL2,
        rotrSH: rotrSH2,
        rotrSL: rotrSL2,
        rotrBH: rotrBH2,
        rotrBL: rotrBL2,
        rotr32H,
        rotr32L,
        rotlSH: rotlSH2,
        rotlSL: rotlSL2,
        rotlBH: rotlBH2,
        rotlBL: rotlBL2,
        add: add2,
        add3L: add3L2,
        add3H: add3H2,
        add4L: add4L2,
        add4H: add4H2,
        add5H: add5H2,
        add5L: add5L2
      };
      exports.default = u64;
    }
  });

  // node_modules/@noble/hashes/sha2.js
  var require_sha2 = __commonJS({
    "node_modules/@noble/hashes/sha2.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.sha512_224 = exports.sha512_256 = exports.sha384 = exports.sha512 = exports.sha224 = exports.sha256 = exports.SHA512_256 = exports.SHA512_224 = exports.SHA384 = exports.SHA512 = exports.SHA224 = exports.SHA256 = void 0;
      var _md_ts_1 = require_md();
      var u64 = require_u64();
      var utils_ts_1 = require_utils();
      var SHA256_K = /* @__PURE__ */ Uint32Array.from([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
      var SHA256 = class extends _md_ts_1.HashMD {
        constructor(outputLen = 32) {
          super(64, outputLen, 8, false);
          this.A = _md_ts_1.SHA256_IV[0] | 0;
          this.B = _md_ts_1.SHA256_IV[1] | 0;
          this.C = _md_ts_1.SHA256_IV[2] | 0;
          this.D = _md_ts_1.SHA256_IV[3] | 0;
          this.E = _md_ts_1.SHA256_IV[4] | 0;
          this.F = _md_ts_1.SHA256_IV[5] | 0;
          this.G = _md_ts_1.SHA256_IV[6] | 0;
          this.H = _md_ts_1.SHA256_IV[7] | 0;
        }
        get() {
          const { A, B, C, D, E, F, G, H } = this;
          return [A, B, C, D, E, F, G, H];
        }
        // prettier-ignore
        set(A, B, C, D, E, F, G, H) {
          this.A = A | 0;
          this.B = B | 0;
          this.C = C | 0;
          this.D = D | 0;
          this.E = E | 0;
          this.F = F | 0;
          this.G = G | 0;
          this.H = H | 0;
        }
        process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
          for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = (0, utils_ts_1.rotr)(W15, 7) ^ (0, utils_ts_1.rotr)(W15, 18) ^ W15 >>> 3;
            const s1 = (0, utils_ts_1.rotr)(W2, 17) ^ (0, utils_ts_1.rotr)(W2, 19) ^ W2 >>> 10;
            SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
          }
          let { A, B, C, D, E, F, G, H } = this;
          for (let i = 0; i < 64; i++) {
            const sigma1 = (0, utils_ts_1.rotr)(E, 6) ^ (0, utils_ts_1.rotr)(E, 11) ^ (0, utils_ts_1.rotr)(E, 25);
            const T1 = H + sigma1 + (0, _md_ts_1.Chi)(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
            const sigma0 = (0, utils_ts_1.rotr)(A, 2) ^ (0, utils_ts_1.rotr)(A, 13) ^ (0, utils_ts_1.rotr)(A, 22);
            const T2 = sigma0 + (0, _md_ts_1.Maj)(A, B, C) | 0;
            H = G;
            G = F;
            F = E;
            E = D + T1 | 0;
            D = C;
            C = B;
            B = A;
            A = T1 + T2 | 0;
          }
          A = A + this.A | 0;
          B = B + this.B | 0;
          C = C + this.C | 0;
          D = D + this.D | 0;
          E = E + this.E | 0;
          F = F + this.F | 0;
          G = G + this.G | 0;
          H = H + this.H | 0;
          this.set(A, B, C, D, E, F, G, H);
        }
        roundClean() {
          (0, utils_ts_1.clean)(SHA256_W);
        }
        destroy() {
          this.set(0, 0, 0, 0, 0, 0, 0, 0);
          (0, utils_ts_1.clean)(this.buffer);
        }
      };
      exports.SHA256 = SHA256;
      var SHA224 = class extends SHA256 {
        constructor() {
          super(28);
          this.A = _md_ts_1.SHA224_IV[0] | 0;
          this.B = _md_ts_1.SHA224_IV[1] | 0;
          this.C = _md_ts_1.SHA224_IV[2] | 0;
          this.D = _md_ts_1.SHA224_IV[3] | 0;
          this.E = _md_ts_1.SHA224_IV[4] | 0;
          this.F = _md_ts_1.SHA224_IV[5] | 0;
          this.G = _md_ts_1.SHA224_IV[6] | 0;
          this.H = _md_ts_1.SHA224_IV[7] | 0;
        }
      };
      exports.SHA224 = SHA224;
      var K5122 = /* @__PURE__ */ (() => u64.split([
        "0x428a2f98d728ae22",
        "0x7137449123ef65cd",
        "0xb5c0fbcfec4d3b2f",
        "0xe9b5dba58189dbbc",
        "0x3956c25bf348b538",
        "0x59f111f1b605d019",
        "0x923f82a4af194f9b",
        "0xab1c5ed5da6d8118",
        "0xd807aa98a3030242",
        "0x12835b0145706fbe",
        "0x243185be4ee4b28c",
        "0x550c7dc3d5ffb4e2",
        "0x72be5d74f27b896f",
        "0x80deb1fe3b1696b1",
        "0x9bdc06a725c71235",
        "0xc19bf174cf692694",
        "0xe49b69c19ef14ad2",
        "0xefbe4786384f25e3",
        "0x0fc19dc68b8cd5b5",
        "0x240ca1cc77ac9c65",
        "0x2de92c6f592b0275",
        "0x4a7484aa6ea6e483",
        "0x5cb0a9dcbd41fbd4",
        "0x76f988da831153b5",
        "0x983e5152ee66dfab",
        "0xa831c66d2db43210",
        "0xb00327c898fb213f",
        "0xbf597fc7beef0ee4",
        "0xc6e00bf33da88fc2",
        "0xd5a79147930aa725",
        "0x06ca6351e003826f",
        "0x142929670a0e6e70",
        "0x27b70a8546d22ffc",
        "0x2e1b21385c26c926",
        "0x4d2c6dfc5ac42aed",
        "0x53380d139d95b3df",
        "0x650a73548baf63de",
        "0x766a0abb3c77b2a8",
        "0x81c2c92e47edaee6",
        "0x92722c851482353b",
        "0xa2bfe8a14cf10364",
        "0xa81a664bbc423001",
        "0xc24b8b70d0f89791",
        "0xc76c51a30654be30",
        "0xd192e819d6ef5218",
        "0xd69906245565a910",
        "0xf40e35855771202a",
        "0x106aa07032bbd1b8",
        "0x19a4c116b8d2d0c8",
        "0x1e376c085141ab53",
        "0x2748774cdf8eeb99",
        "0x34b0bcb5e19b48a8",
        "0x391c0cb3c5c95a63",
        "0x4ed8aa4ae3418acb",
        "0x5b9cca4f7763e373",
        "0x682e6ff3d6b2b8a3",
        "0x748f82ee5defb2fc",
        "0x78a5636f43172f60",
        "0x84c87814a1f0ab72",
        "0x8cc702081a6439ec",
        "0x90befffa23631e28",
        "0xa4506cebde82bde9",
        "0xbef9a3f7b2c67915",
        "0xc67178f2e372532b",
        "0xca273eceea26619c",
        "0xd186b8c721c0c207",
        "0xeada7dd6cde0eb1e",
        "0xf57d4f7fee6ed178",
        "0x06f067aa72176fba",
        "0x0a637dc5a2c898a6",
        "0x113f9804bef90dae",
        "0x1b710b35131c471b",
        "0x28db77f523047d84",
        "0x32caab7b40c72493",
        "0x3c9ebe0a15c9bebc",
        "0x431d67c49c100d4c",
        "0x4cc5d4becb3e42b6",
        "0x597f299cfc657e2a",
        "0x5fcb6fab3ad6faec",
        "0x6c44198c4a475817"
      ].map((n) => BigInt(n))))();
      var SHA512_Kh2 = /* @__PURE__ */ (() => K5122[0])();
      var SHA512_Kl2 = /* @__PURE__ */ (() => K5122[1])();
      var SHA512_W_H2 = /* @__PURE__ */ new Uint32Array(80);
      var SHA512_W_L2 = /* @__PURE__ */ new Uint32Array(80);
      var SHA512 = class extends _md_ts_1.HashMD {
        constructor(outputLen = 64) {
          super(128, outputLen, 16, false);
          this.Ah = _md_ts_1.SHA512_IV[0] | 0;
          this.Al = _md_ts_1.SHA512_IV[1] | 0;
          this.Bh = _md_ts_1.SHA512_IV[2] | 0;
          this.Bl = _md_ts_1.SHA512_IV[3] | 0;
          this.Ch = _md_ts_1.SHA512_IV[4] | 0;
          this.Cl = _md_ts_1.SHA512_IV[5] | 0;
          this.Dh = _md_ts_1.SHA512_IV[6] | 0;
          this.Dl = _md_ts_1.SHA512_IV[7] | 0;
          this.Eh = _md_ts_1.SHA512_IV[8] | 0;
          this.El = _md_ts_1.SHA512_IV[9] | 0;
          this.Fh = _md_ts_1.SHA512_IV[10] | 0;
          this.Fl = _md_ts_1.SHA512_IV[11] | 0;
          this.Gh = _md_ts_1.SHA512_IV[12] | 0;
          this.Gl = _md_ts_1.SHA512_IV[13] | 0;
          this.Hh = _md_ts_1.SHA512_IV[14] | 0;
          this.Hl = _md_ts_1.SHA512_IV[15] | 0;
        }
        // prettier-ignore
        get() {
          const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
          return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
        }
        // prettier-ignore
        set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
          this.Ah = Ah | 0;
          this.Al = Al | 0;
          this.Bh = Bh | 0;
          this.Bl = Bl | 0;
          this.Ch = Ch | 0;
          this.Cl = Cl | 0;
          this.Dh = Dh | 0;
          this.Dl = Dl | 0;
          this.Eh = Eh | 0;
          this.El = El | 0;
          this.Fh = Fh | 0;
          this.Fl = Fl | 0;
          this.Gh = Gh | 0;
          this.Gl = Gl | 0;
          this.Hh = Hh | 0;
          this.Hl = Hl | 0;
        }
        process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H2[i] = view.getUint32(offset);
            SHA512_W_L2[i] = view.getUint32(offset += 4);
          }
          for (let i = 16; i < 80; i++) {
            const W15h = SHA512_W_H2[i - 15] | 0;
            const W15l = SHA512_W_L2[i - 15] | 0;
            const s0h = u64.rotrSH(W15h, W15l, 1) ^ u64.rotrSH(W15h, W15l, 8) ^ u64.shrSH(W15h, W15l, 7);
            const s0l = u64.rotrSL(W15h, W15l, 1) ^ u64.rotrSL(W15h, W15l, 8) ^ u64.shrSL(W15h, W15l, 7);
            const W2h = SHA512_W_H2[i - 2] | 0;
            const W2l = SHA512_W_L2[i - 2] | 0;
            const s1h = u64.rotrSH(W2h, W2l, 19) ^ u64.rotrBH(W2h, W2l, 61) ^ u64.shrSH(W2h, W2l, 6);
            const s1l = u64.rotrSL(W2h, W2l, 19) ^ u64.rotrBL(W2h, W2l, 61) ^ u64.shrSL(W2h, W2l, 6);
            const SUMl = u64.add4L(s0l, s1l, SHA512_W_L2[i - 7], SHA512_W_L2[i - 16]);
            const SUMh = u64.add4H(SUMl, s0h, s1h, SHA512_W_H2[i - 7], SHA512_W_H2[i - 16]);
            SHA512_W_H2[i] = SUMh | 0;
            SHA512_W_L2[i] = SUMl | 0;
          }
          let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
          for (let i = 0; i < 80; i++) {
            const sigma1h = u64.rotrSH(Eh, El, 14) ^ u64.rotrSH(Eh, El, 18) ^ u64.rotrBH(Eh, El, 41);
            const sigma1l = u64.rotrSL(Eh, El, 14) ^ u64.rotrSL(Eh, El, 18) ^ u64.rotrBL(Eh, El, 41);
            const CHIh = Eh & Fh ^ ~Eh & Gh;
            const CHIl = El & Fl ^ ~El & Gl;
            const T1ll = u64.add5L(Hl, sigma1l, CHIl, SHA512_Kl2[i], SHA512_W_L2[i]);
            const T1h = u64.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh2[i], SHA512_W_H2[i]);
            const T1l = T1ll | 0;
            const sigma0h = u64.rotrSH(Ah, Al, 28) ^ u64.rotrBH(Ah, Al, 34) ^ u64.rotrBH(Ah, Al, 39);
            const sigma0l = u64.rotrSL(Ah, Al, 28) ^ u64.rotrBL(Ah, Al, 34) ^ u64.rotrBL(Ah, Al, 39);
            const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
            const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = u64.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = u64.add3L(T1l, sigma0l, MAJl);
            Ah = u64.add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
          }
          ({ h: Ah, l: Al } = u64.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
          ({ h: Bh, l: Bl } = u64.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
          ({ h: Ch, l: Cl } = u64.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
          ({ h: Dh, l: Dl } = u64.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
          ({ h: Eh, l: El } = u64.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
          ({ h: Fh, l: Fl } = u64.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
          ({ h: Gh, l: Gl } = u64.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
          ({ h: Hh, l: Hl } = u64.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
          this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
        }
        roundClean() {
          (0, utils_ts_1.clean)(SHA512_W_H2, SHA512_W_L2);
        }
        destroy() {
          (0, utils_ts_1.clean)(this.buffer);
          this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
      };
      exports.SHA512 = SHA512;
      var SHA384 = class extends SHA512 {
        constructor() {
          super(48);
          this.Ah = _md_ts_1.SHA384_IV[0] | 0;
          this.Al = _md_ts_1.SHA384_IV[1] | 0;
          this.Bh = _md_ts_1.SHA384_IV[2] | 0;
          this.Bl = _md_ts_1.SHA384_IV[3] | 0;
          this.Ch = _md_ts_1.SHA384_IV[4] | 0;
          this.Cl = _md_ts_1.SHA384_IV[5] | 0;
          this.Dh = _md_ts_1.SHA384_IV[6] | 0;
          this.Dl = _md_ts_1.SHA384_IV[7] | 0;
          this.Eh = _md_ts_1.SHA384_IV[8] | 0;
          this.El = _md_ts_1.SHA384_IV[9] | 0;
          this.Fh = _md_ts_1.SHA384_IV[10] | 0;
          this.Fl = _md_ts_1.SHA384_IV[11] | 0;
          this.Gh = _md_ts_1.SHA384_IV[12] | 0;
          this.Gl = _md_ts_1.SHA384_IV[13] | 0;
          this.Hh = _md_ts_1.SHA384_IV[14] | 0;
          this.Hl = _md_ts_1.SHA384_IV[15] | 0;
        }
      };
      exports.SHA384 = SHA384;
      var T224_IV = /* @__PURE__ */ Uint32Array.from([
        2352822216,
        424955298,
        1944164710,
        2312950998,
        502970286,
        855612546,
        1738396948,
        1479516111,
        258812777,
        2077511080,
        2011393907,
        79989058,
        1067287976,
        1780299464,
        286451373,
        2446758561
      ]);
      var T256_IV = /* @__PURE__ */ Uint32Array.from([
        573645204,
        4230739756,
        2673172387,
        3360449730,
        596883563,
        1867755857,
        2520282905,
        1497426621,
        2519219938,
        2827943907,
        3193839141,
        1401305490,
        721525244,
        746961066,
        246885852,
        2177182882
      ]);
      var SHA512_224 = class extends SHA512 {
        constructor() {
          super(28);
          this.Ah = T224_IV[0] | 0;
          this.Al = T224_IV[1] | 0;
          this.Bh = T224_IV[2] | 0;
          this.Bl = T224_IV[3] | 0;
          this.Ch = T224_IV[4] | 0;
          this.Cl = T224_IV[5] | 0;
          this.Dh = T224_IV[6] | 0;
          this.Dl = T224_IV[7] | 0;
          this.Eh = T224_IV[8] | 0;
          this.El = T224_IV[9] | 0;
          this.Fh = T224_IV[10] | 0;
          this.Fl = T224_IV[11] | 0;
          this.Gh = T224_IV[12] | 0;
          this.Gl = T224_IV[13] | 0;
          this.Hh = T224_IV[14] | 0;
          this.Hl = T224_IV[15] | 0;
        }
      };
      exports.SHA512_224 = SHA512_224;
      var SHA512_256 = class extends SHA512 {
        constructor() {
          super(32);
          this.Ah = T256_IV[0] | 0;
          this.Al = T256_IV[1] | 0;
          this.Bh = T256_IV[2] | 0;
          this.Bl = T256_IV[3] | 0;
          this.Ch = T256_IV[4] | 0;
          this.Cl = T256_IV[5] | 0;
          this.Dh = T256_IV[6] | 0;
          this.Dl = T256_IV[7] | 0;
          this.Eh = T256_IV[8] | 0;
          this.El = T256_IV[9] | 0;
          this.Fh = T256_IV[10] | 0;
          this.Fl = T256_IV[11] | 0;
          this.Gh = T256_IV[12] | 0;
          this.Gl = T256_IV[13] | 0;
          this.Hh = T256_IV[14] | 0;
          this.Hl = T256_IV[15] | 0;
        }
      };
      exports.SHA512_256 = SHA512_256;
      exports.sha256 = (0, utils_ts_1.createHasher)(() => new SHA256());
      exports.sha224 = (0, utils_ts_1.createHasher)(() => new SHA224());
      exports.sha512 = (0, utils_ts_1.createHasher)(() => new SHA512());
      exports.sha384 = (0, utils_ts_1.createHasher)(() => new SHA384());
      exports.sha512_256 = (0, utils_ts_1.createHasher)(() => new SHA512_256());
      exports.sha512_224 = (0, utils_ts_1.createHasher)(() => new SHA512_224());
    }
  });

  // node_modules/@noble/hashes/sha512.js
  var require_sha512 = __commonJS({
    "node_modules/@noble/hashes/sha512.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.sha512_256 = exports.SHA512_256 = exports.sha512_224 = exports.SHA512_224 = exports.sha384 = exports.SHA384 = exports.sha512 = exports.SHA512 = void 0;
      var sha2_ts_1 = require_sha2();
      exports.SHA512 = sha2_ts_1.SHA512;
      exports.sha512 = sha2_ts_1.sha512;
      exports.SHA384 = sha2_ts_1.SHA384;
      exports.sha384 = sha2_ts_1.sha384;
      exports.SHA512_224 = sha2_ts_1.SHA512_224;
      exports.sha512_224 = sha2_ts_1.sha512_224;
      exports.SHA512_256 = sha2_ts_1.SHA512_256;
      exports.sha512_256 = sha2_ts_1.sha512_256;
    }
  });

  // node_modules/@noble/hashes/sha256.js
  var require_sha256 = __commonJS({
    "node_modules/@noble/hashes/sha256.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.sha224 = exports.SHA224 = exports.sha256 = exports.SHA256 = void 0;
      var sha2_ts_1 = require_sha2();
      exports.SHA256 = sha2_ts_1.SHA256;
      exports.sha256 = sha2_ts_1.sha256;
      exports.SHA224 = sha2_ts_1.SHA224;
      exports.sha224 = sha2_ts_1.sha224;
    }
  });

  // node_modules/@noble/hashes/hmac.js
  var require_hmac = __commonJS({
    "node_modules/@noble/hashes/hmac.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hmac = exports.HMAC = void 0;
      var utils_ts_1 = require_utils();
      var HMAC = class extends utils_ts_1.Hash {
        constructor(hash, _key) {
          super();
          this.finished = false;
          this.destroyed = false;
          (0, utils_ts_1.ahash)(hash);
          const key = (0, utils_ts_1.toBytes)(_key);
          this.iHash = hash.create();
          if (typeof this.iHash.update !== "function")
            throw new Error("Expected instance of class which extends utils.Hash");
          this.blockLen = this.iHash.blockLen;
          this.outputLen = this.iHash.outputLen;
          const blockLen = this.blockLen;
          const pad2 = new Uint8Array(blockLen);
          pad2.set(key.length > blockLen ? hash.create().update(key).digest() : key);
          for (let i = 0; i < pad2.length; i++)
            pad2[i] ^= 54;
          this.iHash.update(pad2);
          this.oHash = hash.create();
          for (let i = 0; i < pad2.length; i++)
            pad2[i] ^= 54 ^ 92;
          this.oHash.update(pad2);
          (0, utils_ts_1.clean)(pad2);
        }
        update(buf) {
          (0, utils_ts_1.aexists)(this);
          this.iHash.update(buf);
          return this;
        }
        digestInto(out) {
          (0, utils_ts_1.aexists)(this);
          (0, utils_ts_1.abytes)(out, this.outputLen);
          this.finished = true;
          this.iHash.digestInto(out);
          this.oHash.update(out);
          this.oHash.digestInto(out);
          this.destroy();
        }
        digest() {
          const out = new Uint8Array(this.oHash.outputLen);
          this.digestInto(out);
          return out;
        }
        _cloneInto(to) {
          to || (to = Object.create(Object.getPrototypeOf(this), {}));
          const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
          to = to;
          to.finished = finished;
          to.destroyed = destroyed;
          to.blockLen = blockLen;
          to.outputLen = outputLen;
          to.oHash = oHash._cloneInto(to.oHash);
          to.iHash = iHash._cloneInto(to.iHash);
          return to;
        }
        clone() {
          return this._cloneInto();
        }
        destroy() {
          this.destroyed = true;
          this.oHash.destroy();
          this.iHash.destroy();
        }
      };
      exports.HMAC = HMAC;
      var hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
      exports.hmac = hmac;
      exports.hmac.create = (hash, key) => new HMAC(hash, key);
    }
  });

  // node_modules/@noble/hashes/hkdf.js
  var require_hkdf = __commonJS({
    "node_modules/@noble/hashes/hkdf.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hkdf = void 0;
      exports.extract = extract;
      exports.expand = expand;
      var hmac_ts_1 = require_hmac();
      var utils_ts_1 = require_utils();
      function extract(hash, ikm, salt) {
        (0, utils_ts_1.ahash)(hash);
        if (salt === void 0)
          salt = new Uint8Array(hash.outputLen);
        return (0, hmac_ts_1.hmac)(hash, (0, utils_ts_1.toBytes)(salt), (0, utils_ts_1.toBytes)(ikm));
      }
      var HKDF_COUNTER = /* @__PURE__ */ Uint8Array.from([0]);
      var EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
      function expand(hash, prk, info, length = 32) {
        (0, utils_ts_1.ahash)(hash);
        (0, utils_ts_1.anumber)(length);
        const olen = hash.outputLen;
        if (length > 255 * olen)
          throw new Error("Length should be <= 255*HashLen");
        const blocks = Math.ceil(length / olen);
        if (info === void 0)
          info = EMPTY_BUFFER;
        const okm = new Uint8Array(blocks * olen);
        const HMAC = hmac_ts_1.hmac.create(hash, prk);
        const HMACTmp = HMAC._cloneInto();
        const T = new Uint8Array(HMAC.outputLen);
        for (let counter = 0; counter < blocks; counter++) {
          HKDF_COUNTER[0] = counter + 1;
          HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
          okm.set(T, olen * counter);
          HMAC._cloneInto(HMACTmp);
        }
        HMAC.destroy();
        HMACTmp.destroy();
        (0, utils_ts_1.clean)(T, HKDF_COUNTER);
        return okm.slice(0, length);
      }
      var hkdf5 = (hash, ikm, salt, info, length) => expand(hash, extract(hash, ikm, salt), info, length);
      exports.hkdf = hkdf5;
    }
  });

  // widget/widget-styles.ts
  var WIDGET_CSS = `
:host {
  --bg-card: var(--gochat-color-background, #1a1a2e);
  --bg-deep: var(--gochat-color-surface, #0f0f23);
  --border: rgba(69, 189, 209, 0.12);
  --accent: var(--gochat-color-primary, #45bdd1);
  --accent-border: rgba(69, 189, 209, 0.2);
  --accent-subtle: rgba(69, 189, 209, 0.08);
  --accent-dim: rgba(69, 189, 209, 0.3);
  --accent-glow: rgba(69, 189, 209, 0.15);
  --text-bright: var(--gochat-color-text, #e0e0e0);
  --text-dim: rgba(224, 224, 224, 0.5);
  --warning: #f0ad4e;
  --success: #4caf50;
  --danger: #ff5050;
}

/* === FLOAT BUBBLE === */
.gc-float-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:var(--accent);color:#000;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:transform 0.2s,box-shadow 0.2s;z-index:1;}
.gc-float-bubble:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,0.4),0 0 20px rgba(69,189,209,0.3);}
.gc-float-bubble svg{width:24px;height:24px;}
.gc-float-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:var(--danger);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;pointer-events:none;animation:gc-badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes gc-badge-pop{0%{transform:scale(0);}60%{transform:scale(1.15);}100%{transform:scale(1);}}

/* === PANEL DOCK === */
.gc-panel-dock{position:fixed;bottom:90px;right:24px;z-index:2;width:380px;max-width:calc(100vw - 48px);opacity:0;transform:translateY(20px) scale(0.95);transition:opacity 0.3s,transform 0.3s cubic-bezier(0.4,0,0.2,1);pointer-events:none;}
.gc-panel-dock.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}

/* === PANEL === */
.gc-panel{width:100%;background:var(--bg-card);border:1px solid var(--accent-border);border-radius:14px;box-shadow:0 16px 50px rgba(0,0,0,0.3),0 0 1px var(--accent-dim);display:flex;flex-direction:column;overflow:hidden;height:min(520px,calc(100vh - 140px));position:relative;}

/* Screen shake */
.gc-panel.shaking{animation:gc-shake 0.5s ease-out;}
@keyframes gc-shake{
  0%,100%{transform:translate(0,0);}
  10%{transform:translate(-4px,-2px);}
  20%{transform:translate(3px,1px);}
  30%{transform:translate(-2px,3px);}
  40%{transform:translate(4px,-1px);}
  50%{transform:translate(-1px,2px);}
  60%{transform:translate(3px,-3px);}
  70%{transform:translate(-3px,1px);}
  80%{transform:translate(2px,-2px);}
  90%{transform:translate(-1px,1px);}
}

/* === HEADER === */
.gc-header{height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0;background:var(--bg-deep);border-bottom:1px solid var(--border);position:relative;overflow:hidden;}
.gc-header-left{display:flex;align-items:center;gap:0.4rem;}
.gc-header-title{font-family:'JetBrains Mono',monospace;font-size:0.72rem;font-weight:700;color:var(--text-bright);}
.gc-status{width:6px;height:6px;border-radius:50%;flex-shrink:0;transition:background 0.3s;}
.gc-status.offline{background:var(--text-dim);}
.gc-status.connecting{background:var(--warning);animation:gc-pulse-dot 1.2s ease-in-out infinite;}
.gc-status.waiting{background:var(--warning);animation:gc-pulse-dot 1.2s ease-in-out infinite;}
.gc-status.connected{background:var(--success);}
.gc-status.error{background:var(--danger);}
@keyframes gc-pulse-dot{0%,100%{opacity:1;}50%{opacity:0.3;}}
.gc-header-e2e{font-family:'JetBrains Mono',monospace;font-size:0.48rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-dim);display:flex;align-items:center;gap:0.25rem;}
.gc-header-e2e svg{width:9px;height:9px;color:var(--accent);opacity:0.7;}
.gc-header-actions{display:flex;align-items:center;gap:0.15rem;}
.gc-header-btn{background:none;border:none;cursor:pointer;color:var(--text-dim);padding:3px;display:flex;align-items:center;transition:color 0.15s,transform 0.3s;border-radius:4px;}
.gc-header-btn:hover{color:var(--accent);}
.gc-header-btn svg{width:13px;height:13px;}
.gc-minimize-text{font-family:'JetBrains Mono',monospace;font-size:0.46rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;padding:0.15rem 0.45rem;border:1px solid var(--accent-border);border-radius:4px;transition:border-color 0.15s,color 0.15s;}
.gc-header-btn:hover .gc-minimize-text{border-color:var(--accent);color:var(--accent);}
.gc-header-sep{width:1px;height:14px;background:var(--border);flex-shrink:0;margin:0 0.2rem;}
.gc-header-btn.gc-close-btn{color:rgba(255,80,80,0.5);transition:color 0.15s,transform 0.4s;}
.gc-header-btn.gc-close-btn:hover{color:rgba(255,80,80,1);}
.gc-header-btn.gc-close-btn svg{width:16px;height:16px;}
.gc-header-btn.gc-close-btn.spinning{animation:gc-spin-x 0.4s ease-in-out;}
@keyframes gc-spin-x{0%{transform:rotate(0deg);}100%{transform:rotate(180deg);}}

/* === DELETE CONFIRMATION SLIDER === */
.gc-header-main{display:flex;align-items:center;justify-content:space-between;width:100%;height:100%;padding:0 0.7rem;transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);}
.gc-header-confirm{position:absolute;top:0;right:0;width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 0.7rem;background:rgba(180,40,40,0.15);transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);box-sizing:border-box;}
.gc-header.confirming .gc-header-main{transform:translateX(-100%);}
.gc-header.confirming .gc-header-confirm{transform:translateX(0);}
.gc-confirm-text{font-family:'JetBrains Mono',monospace;font-size:0.6rem;font-weight:600;color:rgba(255,80,80,0.9);display:flex;align-items:center;gap:0.3rem;}
.gc-confirm-text svg{width:12px;height:12px;color:rgba(255,80,80,0.9);}
.gc-confirm-actions{display:flex;align-items:center;gap:0.4rem;}
.gc-confirm-yes{background:rgba(255,80,80,0.15);color:rgba(255,80,80,1);border:1px solid rgba(255,80,80,0.3);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.52rem;font-weight:600;padding:0.2rem 0.6rem;border-radius:4px;transition:background 0.15s,transform 0.1s;}
.gc-confirm-yes:hover{background:rgba(255,80,80,0.3);}
.gc-confirm-yes:active{transform:scale(0.95);}
.gc-confirm-no{background:none;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.52rem;font-weight:600;padding:0.2rem 0.6rem;border-radius:4px;transition:background 0.15s;}
.gc-confirm-no:hover{background:var(--accent-subtle);color:var(--text-bright);}

/* ============================================
   DESTRUCTION SEQUENCE - HOLLYWOOD EDITION
   ============================================ */

/* Intense cyan flash - multiple pulses */
.gc-destruct-flash{position:absolute;inset:0;top:38px;background:rgba(69,189,209,0.4);opacity:0;z-index:50;pointer-events:none;mix-blend-mode:screen;}
.gc-destruct-flash.active{animation:gc-flash 1s ease-out forwards;}
@keyframes gc-flash{
  0%{opacity:0;}
  5%{opacity:1;}
  10%{opacity:0.2;}
  15%{opacity:0.9;}
  25%{opacity:0.1;}
  35%{opacity:0.7;}
  50%{opacity:0.05;}
  65%{opacity:0.4;}
  80%{opacity:0.02;}
  100%{opacity:0;}
}

/* Heavy scanlines sweeping down */
.gc-destruct-scanline{position:absolute;inset:0;top:38px;z-index:51;pointer-events:none;opacity:0;}
.gc-destruct-scanline.active{opacity:1;animation:gc-scanline-sweep 1.5s ease-out forwards;}
.gc-destruct-scanline::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(69,189,209,0.08) 3px,rgba(69,189,209,0.08) 5px);}
.gc-destruct-scanline::after{content:'';position:absolute;left:0;right:0;height:4px;background:rgba(69,189,209,0.5);box-shadow:0 0 20px rgba(69,189,209,0.8),0 0 40px rgba(69,189,209,0.4);animation:gc-scanbeam 1.2s ease-in-out forwards;}
@keyframes gc-scanbeam{0%{top:-4px;opacity:1;}100%{top:100%;opacity:0.3;}}
@keyframes gc-scanline-sweep{0%{opacity:1;}80%{opacity:0.6;}100%{opacity:0;}}

/* Message glitch before dissolve */
.gc-msg.glitching{animation:gc-glitch 0.3s ease-out forwards;}
@keyframes gc-glitch{
  0%{transform:translateX(0);filter:brightness(1);}
  15%{transform:translateX(-8px) skewX(-2deg);filter:brightness(2) hue-rotate(90deg);}
  30%{transform:translateX(6px) skewX(3deg);filter:brightness(1.5);}
  45%{transform:translateX(-4px) skewX(-1deg);filter:brightness(3) hue-rotate(-90deg);}
  60%{transform:translateX(3px);filter:brightness(2);}
  75%{transform:translateX(-2px);filter:brightness(1.5) saturate(2);}
  100%{transform:translateX(0);filter:brightness(2.5);}
}

/* Message explode outward */
.gc-msg.exploding{animation:gc-explode 0.5s ease-in forwards;}
@keyframes gc-explode{
  0%{opacity:1;transform:scale(1);filter:brightness(2.5);}
  30%{opacity:0.8;transform:scale(1.1);filter:brightness(3) blur(1px);}
  100%{opacity:0;transform:scale(0.3) translateY(-40px);filter:brightness(0) blur(12px);}
}

/* Spark particles - bigger, glowing */
.gc-spark{position:absolute;width:5px;height:5px;border-radius:50%;pointer-events:none;z-index:52;box-shadow:0 0 8px 2px currentColor;}
.gc-spark.active{animation:gc-spark-fly 1.2s ease-out forwards;}
@keyframes gc-spark-fly{
  0%{opacity:1;transform:translate(0,0) scale(1);}
  50%{opacity:0.8;}
  100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(0);}
}

/* Spark trail effect */
.gc-spark-trail{position:absolute;width:2px;height:2px;border-radius:50%;pointer-events:none;z-index:52;opacity:0.6;}
.gc-spark-trail.active{animation:gc-trail-fade 0.6s ease-out forwards;}
@keyframes gc-trail-fade{0%{opacity:0.6;transform:scale(1);}100%{opacity:0;transform:scale(0);}}

/* Shockwave ring */
.gc-shockwave{position:absolute;border-radius:50%;border:2px solid rgba(69,189,209,0.6);pointer-events:none;z-index:53;opacity:0;}
.gc-shockwave.active{animation:gc-shockwave-expand 0.8s ease-out forwards;}
@keyframes gc-shockwave-expand{
  0%{opacity:1;transform:scale(0);box-shadow:0 0 20px rgba(69,189,209,0.4);}
  50%{opacity:0.6;}
  100%{opacity:0;transform:scale(3);box-shadow:0 0 0 rgba(69,189,209,0);}
}

/* === DESTROYED OVERLAY === */
.gc-destroyed-overlay{position:absolute;inset:0;top:38px;z-index:55;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.6rem;opacity:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(69,189,209,0.08) 0%,transparent 60%);}
.gc-destroyed-overlay.active{animation:gc-overlay-in 0.5s ease-out 0.3s forwards;}
@keyframes gc-overlay-in{to{opacity:1;}}
.gc-destroyed-icon{width:56px;height:56px;opacity:0;animation:gc-icon-slam 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s forwards;}
.gc-destroyed-icon svg{width:56px;height:56px;color:rgba(69,189,209,0.9);filter:drop-shadow(0 0 15px rgba(69,189,209,0.7)) drop-shadow(0 0 30px rgba(69,189,209,0.4));}
@keyframes gc-icon-slam{
  0%{opacity:0;transform:scale(3) rotate(180deg);filter:blur(8px);}
  60%{opacity:1;transform:scale(0.9) rotate(-10deg);filter:blur(0);}
  80%{transform:scale(1.05) rotate(3deg);}
  100%{opacity:1;transform:scale(1) rotate(0);filter:blur(0);}
}
.gc-destroyed-text{font-family:'JetBrains Mono',monospace;font-size:0.75rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(69,189,209,0.95);text-shadow:0 0 15px rgba(69,189,209,0.7),0 0 35px rgba(69,189,209,0.4),0 0 60px rgba(69,189,209,0.15);opacity:0;animation:gc-text-slam 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.7s forwards;}
@keyframes gc-text-slam{
  0%{opacity:0;transform:translateY(20px) scaleY(3) scaleX(0.3);filter:blur(6px);}
  50%{opacity:1;transform:translateY(-3px) scaleY(0.9) scaleX(1.05);filter:blur(0);}
  70%{transform:translateY(1px) scaleY(1.05) scaleX(0.98);}
  100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0);}
}
.gc-destroyed-sub{font-family:'JetBrains Mono',monospace;font-size:0.46rem;color:var(--text-dim);letter-spacing:0.08em;opacity:0;animation:gc-step-fade-in 0.4s ease-out 1.2s forwards;}
.gc-destroyed-line{width:100px;height:1px;background:linear-gradient(90deg,transparent,rgba(69,189,209,0.6),transparent);opacity:0;animation:gc-line-expand 0.5s ease-out 0.9s forwards;}
@keyframes gc-line-expand{0%{opacity:0;width:0;}100%{opacity:1;width:100px;}}

/* === MESSAGES === */
.gc-messages{flex:1;min-height:0;overflow-y:auto;padding:0.6rem 0.7rem 0.4rem;display:flex;flex-direction:column;gap:0.5rem;scrollbar-width:thin;scrollbar-color:var(--accent-dim) transparent;}
.gc-messages::-webkit-scrollbar{width:2px;}
.gc-messages::-webkit-scrollbar-thumb{background:var(--accent-dim);border-radius:2px;}
.gc-msg{display:flex;align-items:flex-end;gap:0.4rem;opacity:0;transform:translateY(8px);animation:gc-msg-in 0.2s ease-out forwards;}
@keyframes gc-msg-in{to{opacity:1;transform:translateY(0);}}
.gc-msg.incoming{justify-content:flex-start;}
.gc-msg.outgoing{justify-content:flex-end;}
.gc-avatar{width:24px;height:24px;border-radius:50%;background:var(--accent-subtle);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.gc-avatar svg{width:12px;height:12px;color:var(--accent);}
.gc-msg.outgoing .gc-avatar{display:none;}
.gc-bubble{max-width:85%;padding:0.5rem 0.65rem;font-family:'JetBrains Mono',monospace;font-size:0.82rem;line-height:1.55;word-break:break-word;}
.gc-msg.incoming .gc-bubble{background:var(--bg-deep);color:var(--text-bright);border-radius:14px 14px 14px 4px;border:1px solid var(--accent-border);}
.gc-msg.outgoing .gc-bubble{background:var(--accent);color:#000;border-radius:14px 14px 2px 14px;}
[data-theme="dark"] .gc-msg.outgoing .gc-bubble{color:#000;}
.gc-time{font-family:'JetBrains Mono',monospace;font-size:0.46rem;color:var(--text-dim);margin-top:0.15rem;}
.gc-msg.incoming .gc-time{text-align:left;padding-left:2.2rem;}
.gc-msg.outgoing .gc-time{text-align:right;}
.gc-check{display:inline-flex;align-items:center;margin-left:0.2rem;}
.gc-check svg{width:10px;height:10px;color:var(--text-dim);}
.gc-typing{display:flex;align-items:flex-end;gap:0.4rem;}
.gc-typing-dots{display:flex;gap:3px;padding:0.55rem 0.7rem;background:var(--bg-deep);border:1px solid var(--accent-border);border-radius:14px 14px 14px 4px;}
.gc-typing-dots span{width:6px;height:6px;border-radius:50%;background:var(--text-dim);animation:gc-dot-bounce 1.2s ease-in-out infinite;}
.gc-typing-dots span:nth-child(2){animation-delay:0.15s;}
.gc-typing-dots span:nth-child(3){animation-delay:0.3s;}
@keyframes gc-dot-bounce{0%,60%,100%{transform:scale(0.5);opacity:0.4;}30%{transform:scale(1);opacity:1;}}

/* === STEP VIEWS === */
.gc-step{display:none;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:0.8rem;padding:2rem 1.5rem;text-align:center;}
.gc-step.active{display:flex;}
.gc-step-icon{width:48px;height:48px;border-radius:50%;background:var(--accent-subtle);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.1s forwards;}
.gc-step-icon svg{width:24px;height:24px;color:var(--accent);}
.gc-step-title{font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--text-dim);line-height:1.5;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.2s forwards;}
@keyframes gc-step-fade-in{to{opacity:1;}}
.gc-start-btn{background:var(--accent);color:#000;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.68rem;font-weight:600;padding:0.5rem 1.2rem;border-radius:8px;transition:transform 0.15s,box-shadow 0.15s;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.3s forwards;}
.gc-start-btn:hover{transform:scale(1.04);box-shadow:0 0 12px var(--accent-glow);}
.gc-start-btn:active{transform:scale(0.97);}
.gc-name-input{width:100%;max-width:240px;padding:0.5rem 0.8rem;background:var(--bg-deep);border:1px solid var(--accent-border);border-radius:8px;color:var(--text-bright);font-family:'JetBrains Mono',monospace;font-size:0.72rem;outline:none;transition:border-color 0.2s,box-shadow 0.2s;text-align:center;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.25s forwards;}
.gc-name-input::placeholder{color:var(--text-dim);}
.gc-name-input:focus{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-glow);}
.gc-name-actions{display:flex;gap:0.5rem;width:100%;max-width:240px;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.35s forwards;}
.gc-name-actions .gc-start-btn{flex:1;margin:0;opacity:1;animation:none;}
.gc-btn-alt{background:var(--bg-deep);color:var(--text-dim);border:1px solid var(--accent-border);}
.gc-btn-alt:hover{color:var(--text-bright);border-color:var(--accent);box-shadow:0 0 8px var(--accent-glow);transform:scale(1.04);}
.gc-waiting-spinner{width:48px;height:48px;border-radius:50%;border:2px solid var(--accent-border);border-top-color:var(--accent);animation:gc-spin 1s linear infinite;}
@keyframes gc-spin{to{transform:rotate(360deg);}}
.gc-waiting-text{font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--text-dim);line-height:1.6;max-width:220px;}
.gc-waiting-dots::after{content:'';animation:gc-ellipsis 1.5s steps(3) infinite;}
@keyframes gc-ellipsis{0%{content:'';}33%{content:'.';}66%{content:'..';}100%{content:'...';}}
.gc-offline-prompt{display:flex;flex-direction:column;align-items:center;gap:0.5rem;margin-top:0.5rem;opacity:0;animation:gc-step-fade-in 0.6s ease-out 0.5s forwards;}
.gc-offline-prompt .gc-start-btn{opacity:1;animation:none;font-size:0.6rem;padding:0.4rem 1rem;}
.gc-offline-hint{font-family:'JetBrains Mono',monospace;font-size:0.5rem;color:var(--text-dim);opacity:0.6;}
.gc-offline-end{display:flex;align-items:center;justify-content:center;padding:0.5rem 0.7rem;border-top:1px solid var(--border);background:var(--bg-deep);}
.gc-offline-end-btn{background:rgba(255,80,80,0.1);color:rgba(255,80,80,0.7);border:1px solid rgba(255,80,80,0.2);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.56rem;font-weight:600;padding:0.35rem 0.8rem;border-radius:6px;transition:background 0.15s,color 0.15s;width:100%;}
.gc-offline-end-btn:hover{background:rgba(255,80,80,0.2);color:rgba(255,80,80,1);}

/* === ENCRYPTION BADGE === */
.gc-encrypt-badge{flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:0.3rem;padding:0.35rem 0.7rem;background:var(--accent-subtle);border-top:1px solid var(--border);font-family:'JetBrains Mono',monospace;font-size:0.52rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-dim);position:relative;overflow:hidden;}
.gc-encrypt-badge svg{width:10px;height:10px;color:var(--accent);flex-shrink:0;}
.gc-encrypt-badge::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.04) 45%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 55%,transparent 70%);animation:gc-shimmer 5s ease-in-out infinite;pointer-events:none;}
@keyframes gc-shimmer{0%{left:-100%;}35%{left:150%;}100%{left:150%;}}

/* === INPUT AREA === */
.gc-input-area{flex-shrink:0;display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.7rem 0.7rem;border-top:1px solid var(--border);background:var(--bg-deep);}
.gc-input-area.disabled{opacity:0.4;pointer-events:none;}
.gc-input{flex:1;min-height:40px;max-height:120px;resize:none;border:1px solid var(--accent-border);border-radius:20px;padding:0.5rem 0.8rem;font-family:'JetBrains Mono',monospace;font-size:0.82rem;line-height:1.5;color:var(--text-bright);background:var(--bg-card);outline:none;transition:border-color 0.2s,box-shadow 0.2s;scrollbar-width:thin;scrollbar-color:var(--accent-dim) transparent;}
.gc-input::-webkit-scrollbar{width:2px;}
.gc-input::-webkit-scrollbar-thumb{background:var(--accent-dim);border-radius:2px;}
.gc-input::placeholder{color:var(--text-dim);font-size:0.72rem;}
.gc-input:focus{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-glow);}
.gc-send{width:40px;height:40px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;color:#000;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.15s,box-shadow 0.15s,opacity 0.2s;opacity:0.4;}
.gc-send.active{opacity:1;}
.gc-send:hover{box-shadow:0 0 12px var(--accent-glow);}
.gc-send:active{transform:scale(0.92);}
.gc-send svg{width:16px;height:16px;}

/* === RESPONSIVE === */
@media(max-width:768px){
  .gc-float-bubble{bottom:16px;right:16px;width:52px;height:52px;}
  .gc-float-bubble svg{width:22px;height:22px;}
  .gc-panel-dock{position:fixed;bottom:0;left:0;right:0;width:100vw;max-width:100vw;border-radius:0;}
  .gc-panel{height:calc(100vh - 60px);border-radius:14px 14px 0 0;border-left:none;border-right:none;border-bottom:none;}
  .gc-header{padding:0;}
  .gc-header-main{padding:0 1.4rem 0 1rem;}
  .gc-header-confirm{padding:0 1.4rem 0 1rem;}
  .gc-messages{padding:0.6rem 1.4rem 0.4rem 1rem;}
  .gc-encrypt-badge{padding:0.35rem 1.4rem 0.35rem 1rem;}
  .gc-input-area{padding:0.6rem 1.4rem 0.7rem 1rem;}
  .gc-step{padding:2rem 1.4rem 2rem 1.2rem;}
  .gc-bubble{max-width:85%;}
  .gc-input{min-height:48px;}
}

/* === BUBBLE ANIMATIONS (internal only - nothing outside bubble) === */

/* 1. inner-glow: soft inner box-shadow pulsing */
@keyframes gc-inner-glow{0%,100%{box-shadow:inset 0 0 12px rgba(255,255,255,0);}50%{box-shadow:inset 0 0 20px rgba(255,255,255,0.35);}}
.gc-float-bubble.anim-inner-glow{animation:gc-inner-glow 3s ease-in-out infinite;}

/* 2. icon-breathe: only SVG icon scales */
@keyframes gc-icon-breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.15);}}
.gc-float-bubble.anim-icon-breathe svg{animation:gc-icon-breathe 2.5s ease-in-out infinite;}

/* 3. shimmer: light streak sweeps across */
@keyframes gc-shimmer-sweep{0%{left:-100%;}100%{left:200%;}}
.gc-float-bubble.anim-shimmer{position:relative;overflow:hidden;}
.gc-float-bubble.anim-shimmer::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:gc-shimmer-sweep 3s ease-in-out infinite;pointer-events:none;}

/* 4. wiggle: icon shakes briefly */
@keyframes gc-wiggle{0%,85%,100%{transform:rotate(0deg);}88%{transform:rotate(-12deg);}91%{transform:rotate(10deg);}94%{transform:rotate(-8deg);}97%{transform:rotate(5deg);}}
.gc-float-bubble.anim-wiggle svg{animation:gc-wiggle 4s ease-in-out infinite;}

/* 5. color-shift: brightness shifts */
@keyframes gc-color-shift{0%,100%{filter:brightness(1);}50%{filter:brightness(1.2);}}
.gc-float-bubble.anim-color-shift{animation:gc-color-shift 3s ease-in-out infinite;}

/* 6. icon-flip: Y-axis rotation */
@keyframes gc-icon-flip{0%,80%,100%{transform:rotateY(0deg);}90%{transform:rotateY(180deg);}}
.gc-float-bubble.anim-icon-flip svg{animation:gc-icon-flip 5s ease-in-out infinite;transform-style:preserve-3d;}

/* 7. notification-dot: pulsing white dot inside */
@keyframes gc-dot-pulse{0%,100%{opacity:0;transform:scale(0);}50%{opacity:1;transform:scale(1);}}
.gc-float-bubble.anim-notification-dot{position:relative;}
.gc-float-bubble.anim-notification-dot::after{content:'';position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:50%;background:#fff;animation:gc-dot-pulse 2s ease-in-out infinite;pointer-events:none;z-index:3;}

/* 8. radar-sweep: rotating conic gradient inside */
@keyframes gc-sweep{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
.gc-float-bubble.anim-radar-sweep{position:relative;overflow:hidden;}
.gc-float-bubble.anim-radar-sweep::after{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,transparent 0%,rgba(255,255,255,0.25) 25%,transparent 50%);animation:gc-sweep 3s linear infinite;pointer-events:none;}

/* 9. shimmer-flip (DEFAULT): shimmer + icon-flip combined */
.gc-float-bubble.anim-shimmer-flip{position:relative;overflow:hidden;}
.gc-float-bubble.anim-shimmer-flip::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:gc-shimmer-sweep 3s ease-in-out infinite;pointer-events:none;}
.gc-float-bubble.anim-shimmer-flip svg{animation:gc-icon-flip 5s ease-in-out infinite;transform-style:preserve-3d;}

/* 10. pulse: classic expanding rings */
@keyframes gc-pulse-ring{0%{transform:scale(1);opacity:0.5;}100%{transform:scale(1.9);opacity:0;}}
.gc-float-bubble.anim-pulse{position:relative;}
.gc-float-bubble.anim-pulse::before,.gc-float-bubble.anim-pulse::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--gochat-color-primary,#45bdd1);animation:gc-pulse-ring 2.2s ease-out infinite;pointer-events:none;}
.gc-float-bubble.anim-pulse::after{animation-delay:1.1s;}

/* 11. neon: hue-rotate color cycling */
@keyframes gc-neon{0%{filter:hue-rotate(0deg) brightness(1.1);}25%{filter:hue-rotate(90deg) brightness(1.2);}50%{filter:hue-rotate(180deg) brightness(1.1);}75%{filter:hue-rotate(270deg) brightness(1.2);}100%{filter:hue-rotate(360deg) brightness(1.1);}}
.gc-float-bubble.anim-neon{animation:gc-neon 6s linear infinite;}

/* 12. heartbeat: two quick pulses then pause */
@keyframes gc-heartbeat{0%,100%{transform:scale(1);}14%{transform:scale(1.12);}20%{transform:scale(1);}28%{transform:scale(1.08);}34%{transform:scale(1);}}
.gc-float-bubble.anim-heartbeat{animation:gc-heartbeat 2s ease-in-out infinite;}

/* 13. jelly: wobbly elastic effect */
@keyframes gc-jelly{0%,100%{transform:scale(1,1);}25%{transform:scale(0.9,1.1);}50%{transform:scale(1.1,0.9);}75%{transform:scale(0.95,1.05);}}
.gc-float-bubble.anim-jelly{animation:gc-jelly 3s ease-in-out infinite;}

/* 14. ring-rotate: spinning ring border */
@keyframes gc-ring-spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
.gc-float-bubble.anim-ring-rotate{position:relative;}
.gc-float-bubble.anim-ring-rotate::before{content:'';position:absolute;inset:-3px;border-radius:50%;border:2px solid transparent;border-top-color:var(--gochat-color-primary,#45bdd1);border-right-color:var(--gochat-color-primary,#45bdd1);animation:gc-ring-spin 1.5s linear infinite;pointer-events:none;}

/* 15. float: gentle up-down hover */
@keyframes gc-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
.gc-float-bubble.anim-float{animation:gc-float 4s ease-in-out infinite;}

/* Suppress animations when panel is open */
.gc-float-bubble.panel-open,.gc-float-bubble.panel-open svg{animation:none !important;}
.gc-float-bubble.panel-open::before,.gc-float-bubble.panel-open::after{display:none;}

/* === REDUCED MOTION === */
@media(prefers-reduced-motion:reduce){
  .gc-panel-dock,.gc-header-main,.gc-header-confirm,.gc-float-bubble{transition:none;}
  .gc-msg,.gc-step-icon,.gc-step-title,.gc-start-btn,.gc-name-input,.gc-name-actions{animation:none;opacity:1;transform:none;}
  .gc-typing-dots span,.gc-encrypt-badge::after,.gc-float-badge,.gc-waiting-spinner{animation:none;}
  .gc-panel.shaking,.gc-header-btn.gc-close-btn.spinning,.gc-msg.glitching,.gc-msg.exploding,.gc-destruct-flash.active,.gc-destruct-scanline.active{animation:none;}
  .gc-destroyed-icon,.gc-destroyed-text,.gc-destroyed-sub,.gc-destroyed-line{animation:none;opacity:1;}
  .gc-float-bubble,.gc-float-bubble svg{animation:none !important;}
  .gc-float-bubble::before,.gc-float-bubble::after{display:none;}
}
`;

  // widget/widget-template.ts
  var WIDGET_TEMPLATE = `<div class="gc-panel-dock" id="gc-panel-dock">
  <div class="gc-panel">
    <!-- Header with delete confirmation slider -->
    <div class="gc-header" id="gc-header">
      <div class="gc-header-main">
        <div class="gc-header-left">
          <span class="gc-status offline" id="gc-status"></span>
          <span class="gc-header-title" id="gc-header-title">GoChat</span>
          <span class="gc-header-e2e">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            E2E Encrypted
          </span>
        </div>
        <div class="gc-header-actions">
          <button class="gc-header-btn" id="gc-minimize" aria-label="Minimize"><span class="gc-minimize-text">Minimize</span></button>
          <span class="gc-header-sep"></span>
          <button class="gc-header-btn gc-close-btn" id="gc-close" aria-label="Delete chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="gc-header-confirm">
        <div class="gc-confirm-text"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>Delete this chat?</div>
        <div class="gc-confirm-actions">
          <button class="gc-confirm-yes" id="gc-confirm-yes">Delete</button>
          <button class="gc-confirm-no" id="gc-confirm-no">Cancel</button>
        </div>
      </div>
    </div>
    <!-- Step 1: Start -->
    <div class="gc-step active" id="gc-step-start">
      <div class="gc-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
      <div class="gc-step-title">Start an encrypted conversation.</div>
      <button class="gc-start-btn" id="gc-start-btn">Start Encrypted Chat</button>
    </div>
    <!-- Step 2: Name input -->
    <div class="gc-step" id="gc-step-name">
      <div class="gc-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div class="gc-step-title">How should we call you?</div>
      <input type="text" class="gc-name-input" id="gc-name-input" placeholder="Enter your name" autocomplete="off" />
      <div class="gc-name-actions">
        <button class="gc-start-btn" id="gc-name-go">Start Chat</button>
        <button class="gc-start-btn gc-btn-alt" id="gc-guest-btn">Guest</button>
      </div>
    </div>
    <!-- Step 3: Waiting -->
    <div class="gc-step" id="gc-step-waiting">
      <div class="gc-waiting-spinner"></div>
      <div class="gc-step-title">Connecting to support<span class="gc-waiting-dots"></span></div>
      <div class="gc-waiting-text">Please wait while a support agent accepts your request.</div>
      <div class="gc-offline-prompt" id="gc-offline-prompt">
        <div class="gc-offline-hint">or</div>
        <button class="gc-start-btn gc-btn-alt" id="gc-offline-btn">Leave an Offline Message</button>
      </div>
    </div>
    <!-- Step 4: Chat -->
    <div id="gc-chat-view" style="display:none;flex:1;flex-direction:column;min-height:0;">
      <div class="gc-messages" id="gc-messages"></div>
      <div class="gc-encrypt-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        End-to-end encrypted via SimpleX
      </div>
    </div>
    <!-- Input -->
    <div class="gc-input-area" id="gc-input-area" style="display:none;">
      <textarea class="gc-input" id="gc-input" placeholder="Type a message..." rows="1"></textarea>
      <button class="gc-send" id="gc-send" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
    </div>
    <!-- Offline end -->
    <div class="gc-offline-end" id="gc-offline-end" style="display:none;">
      <button class="gc-offline-end-btn" id="gc-offline-end-btn">Close and Delete Chat</button>
    </div>
  </div>
</div>`;
  var BUBBLE_TEMPLATE = `<button class="gc-float-bubble" id="gc-float-bubble" aria-label="Open chat">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  <span class="gc-float-badge" id="gc-float-badge" style="display:none">0</span>
</button>`;

  // widget/widget-ui.ts
  function initUI(shadow, host, config) {
    const dock = shadow.getElementById("gc-panel-dock");
    const messages = shadow.getElementById("gc-messages");
    const input = shadow.getElementById("gc-input");
    const sendBtn = shadow.getElementById("gc-send");
    const statusDot = shadow.getElementById("gc-status");
    const inputArea = shadow.getElementById("gc-input-area");
    const header = shadow.getElementById("gc-header");
    const panel = dock ? dock.querySelector(".gc-panel") : null;
    const headerTitle = shadow.getElementById("gc-header-title");
    const stepStart = shadow.getElementById("gc-step-start");
    const stepName = shadow.getElementById("gc-step-name");
    const stepWaiting = shadow.getElementById("gc-step-waiting");
    const chatView = shadow.getElementById("gc-chat-view");
    const startBtn = shadow.getElementById("gc-start-btn");
    const nameInput = shadow.getElementById("gc-name-input");
    const nameGoBtn = shadow.getElementById("gc-name-go");
    const guestBtn = shadow.getElementById("gc-guest-btn");
    const offlineBtn = shadow.getElementById("gc-offline-btn");
    const minimizeBtn = shadow.getElementById("gc-minimize");
    const closeBtn = shadow.getElementById("gc-close");
    const confirmYes = shadow.getElementById("gc-confirm-yes");
    const confirmNo = shadow.getElementById("gc-confirm-no");
    const offlineEndWrap = shadow.getElementById("gc-offline-end");
    const offlineEndBtn = shadow.getElementById("gc-offline-end-btn");
    const bubble = shadow.getElementById("gc-float-bubble");
    const floatBadge = shadow.getElementById("gc-float-badge");
    let panelOpen = false;
    let connected = false;
    let unreadCount = 0;
    let offlineMode = false;
    let offlineSent = false;
    let confirmMode = false;
    let exploding = false;
    let client = null;
    let pendingChecks = [];
    if (headerTitle && config.name) headerTitle.textContent = config.name;
    if (bubble && config.bubbleAnimation && config.bubbleAnimation !== "none") {
      bubble.classList.add("anim-" + config.bubbleAnimation);
    }
    function openPanel() {
      if (panelOpen || exploding) return;
      panelOpen = true;
      if (dock) dock.classList.add("open");
      if (bubble) bubble.classList.add("panel-open");
      clearUnread();
      if (connected && input) setTimeout(() => input.focus(), 400);
    }
    function closePanel() {
      if (!panelOpen) return;
      panelOpen = false;
      if (dock) dock.classList.remove("open");
      if (bubble) bubble.classList.remove("panel-open");
      if (offlineSent) setTimeout(() => resetChat(), 400);
    }
    function togglePanel() {
      if (panelOpen) closePanel();
      else openPanel();
    }
    if (bubble) bubble.addEventListener("click", (e) => {
      e.preventDefault();
      togglePanel();
    });
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (panelOpen && !exploding && !host.contains(target)) closePanel();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (exploding) return;
        if (confirmMode) {
          cancelConfirm();
          return;
        }
        if (panelOpen) closePanel();
      }
    });
    if (minimizeBtn) minimizeBtn.addEventListener("click", () => {
      if (exploding) return;
      if (confirmMode) {
        cancelConfirm();
        return;
      }
      togglePanel();
    });
    if (closeBtn) closeBtn.addEventListener("click", () => {
      if (exploding) return;
      if (confirmMode) {
        cancelConfirm();
        return;
      }
      showConfirm();
    });
    function showConfirm() {
      confirmMode = true;
      if (closeBtn) closeBtn.classList.add("spinning");
      setTimeout(() => {
        if (closeBtn) closeBtn.classList.remove("spinning");
        if (header) header.classList.add("confirming");
      }, 400);
    }
    function cancelConfirm() {
      confirmMode = false;
      if (header) header.classList.remove("confirming");
    }
    function confirmDelete() {
      confirmMode = false;
      if (header) header.classList.remove("confirming");
      runDestructionSequence();
    }
    if (confirmYes) confirmYes.addEventListener("click", confirmDelete);
    if (confirmNo) confirmNo.addEventListener("click", cancelConfirm);
    function runDestructionSequence() {
      if (exploding || !panel) return;
      exploding = true;
      if (stepStart) stepStart.classList.remove("active");
      if (stepName) stepName.classList.remove("active");
      if (stepWaiting) stepWaiting.classList.remove("active");
      if (chatView) chatView.style.display = "flex";
      if (inputArea) inputArea.style.display = "none";
      if (offlineEndWrap) offlineEndWrap.style.display = "none";
      const encBadge = panel.querySelector(".gc-encrypt-badge");
      if (encBadge) encBadge.style.display = "none";
      if (messages) messages.style.overflow = "visible";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        startDestructionPhases(encBadge);
      }));
    }
    function startDestructionPhases(encBadge) {
      if (!panel) return;
      panel.classList.add("shaking");
      const flash = document.createElement("div");
      flash.className = "gc-destruct-flash active";
      panel.appendChild(flash);
      const scanline = document.createElement("div");
      scanline.className = "gc-destruct-scanline active";
      panel.appendChild(scanline);
      const msgs = messages ? Array.from(messages.querySelectorAll(".gc-msg")) : [];
      for (let i = 0; i < msgs.length; i++) {
        const el = msgs[i];
        const glitchDelay = i * 200;
        const explodeDelay = glitchDelay + 350;
        setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.animation = "gc-glitch 0.35s ease-out forwards";
        }, glitchDelay);
        setTimeout(() => {
          el.style.animation = "gc-explode 0.5s ease-in forwards";
          spawnSparks(el, 12);
          spawnShockwave(el);
        }, explodeDelay);
      }
      const totalTime = msgs.length > 0 ? (msgs.length - 1) * 200 + 350 + 500 : 200;
      setTimeout(() => panel.classList.remove("shaking"), 500);
      if (msgs.length > 0) {
        setTimeout(() => {
          panel.classList.add("shaking");
          setTimeout(() => panel.classList.remove("shaking"), 500);
        }, 350);
      }
      setTimeout(() => {
        if (chatView) chatView.style.display = "none";
        if (messages) {
          messages.style.overflow = "";
          messages.style.display = "";
        }
        panel.classList.add("shaking");
        setTimeout(() => panel.classList.remove("shaking"), 500);
        const ov = document.createElement("div");
        ov.className = "gc-destroyed-overlay active";
        ov.innerHTML = '<div class="gc-destroyed-line"></div><div class="gc-destroyed-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="9" x2="15" y2="15" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke-width="2"/></svg></div><div class="gc-destroyed-text">Messages Destroyed</div><div class="gc-destroyed-sub">End-to-end encrypted session terminated</div><div class="gc-destroyed-line"></div>';
        panel.appendChild(ov);
        setTimeout(() => {
          closePanel();
          setTimeout(() => {
            flash.remove();
            scanline.remove();
            ov.remove();
            const debris = panel.querySelectorAll(".gc-spark,.gc-spark-trail,.gc-shockwave");
            for (let s = 0; s < debris.length; s++) debris[s].remove();
            if (encBadge) encBadge.style.display = "";
            resetChat();
            exploding = false;
          }, 500);
        }, 2200);
      }, totalTime + 300);
    }
    function spawnSparks(el, count) {
      if (!panel) return;
      const panelRect = panel.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const cx = elRect.left - panelRect.left + elRect.width / 2;
      const cy = elRect.top - panelRect.top + elRect.height / 2;
      const colors = ["rgba(69,189,209,1)", "rgba(100,220,240,1)", "rgba(140,230,250,0.9)", "rgba(50,170,200,1)", "rgba(200,245,255,0.8)"];
      for (let i = 0; i < count; i++) {
        const spark = document.createElement("div");
        spark.className = "gc-spark";
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 120;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;
        const col = colors[Math.floor(Math.random() * colors.length)];
        spark.style.cssText = "left:" + cx + "px;top:" + cy + "px;background:" + col + ";color:" + col + ";--sx:" + sx + "px;--sy:" + sy + "px;";
        panel.appendChild(spark);
        spark.classList.add("active");
        for (let t = 0; t < 3; t++) {
          ((tx, ty, c, delay) => {
            setTimeout(() => {
              const trail = document.createElement("div");
              trail.className = "gc-spark-trail";
              trail.style.cssText = "left:" + (cx + tx * 0.2) + "px;top:" + (cy + ty * 0.2) + "px;background:" + c + ";";
              panel.appendChild(trail);
              trail.classList.add("active");
              setTimeout(() => trail.remove(), 600);
            }, delay);
          })(sx * (t + 1) * 0.15, sy * (t + 1) * 0.15, col, (t + 1) * 80);
        }
        setTimeout((s) => s.remove(), 1200, spark);
      }
    }
    function spawnShockwave(el) {
      if (!panel) return;
      const panelRect = panel.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const cx = elRect.left - panelRect.left + elRect.width / 2;
      const cy = elRect.top - panelRect.top + elRect.height / 2;
      const wave = document.createElement("div");
      wave.className = "gc-shockwave";
      wave.style.cssText = "left:" + (cx - 40) + "px;top:" + (cy - 40) + "px;width:80px;height:80px;";
      panel.appendChild(wave);
      wave.classList.add("active");
      setTimeout(() => wave.remove(), 800);
    }
    if (offlineEndBtn) offlineEndBtn.addEventListener("click", () => runDestructionSequence());
    function resetChat() {
      if (client) {
        client.disconnect().catch(() => {
        }).finally(() => {
          client = null;
        });
      }
      connected = false;
      offlineMode = false;
      offlineSent = false;
      confirmMode = false;
      pendingChecks = [];
      if (messages) messages.innerHTML = "";
      if (nameInput) nameInput.value = "";
      if (offlineEndWrap) offlineEndWrap.style.display = "none";
      if (header) header.classList.remove("confirming");
      if (messages) {
        messages.style.overflow = "";
        messages.style.display = "";
      }
      setStatus("offline");
      showStep("start");
    }
    function showStep(step) {
      if (stepStart) stepStart.classList.remove("active");
      if (stepName) stepName.classList.remove("active");
      if (stepWaiting) stepWaiting.classList.remove("active");
      if (chatView) chatView.style.display = "none";
      if (inputArea) inputArea.style.display = "none";
      if (offlineEndWrap) offlineEndWrap.style.display = "none";
      if (step === "start" && stepStart) stepStart.classList.add("active");
      if (step === "name" && stepName) stepName.classList.add("active");
      if (step === "waiting" && stepWaiting) stepWaiting.classList.add("active");
      if (step === "chat") {
        if (chatView) chatView.style.display = "flex";
        if (inputArea) {
          inputArea.style.display = "flex";
          inputArea.classList.remove("disabled");
        }
      }
      if (step === "offline") {
        if (chatView) chatView.style.display = "flex";
        if (inputArea) {
          inputArea.style.display = "flex";
          inputArea.classList.remove("disabled");
        }
      }
    }
    function setUnread(n) {
      unreadCount = n;
      const badgeEl = floatBadge;
      if (!badgeEl) return;
      if (n > 0) {
        badgeEl.textContent = n > 99 ? "99+" : String(n);
        badgeEl.style.display = "flex";
      } else {
        badgeEl.style.display = "none";
      }
    }
    function clearUnread() {
      setUnread(0);
    }
    function incrementUnread() {
      if (!panelOpen) setUnread(unreadCount + 1);
    }
    function setStatus(state) {
      if (!statusDot) return;
      statusDot.className = "gc-status " + state;
    }
    function scrollToBottom() {
      if (messages) messages.scrollTop = messages.scrollHeight;
    }
    function addMessage(text, type, delay) {
      if (!messages) return;
      const row = document.createElement("div");
      row.className = "gc-msg " + type;
      row.style.animationDelay = (delay || 0) + "ms";
      if (type === "incoming") {
        row.innerHTML = '<div class="gc-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div><div class="gc-bubble">' + escHtml(text) + '</div><div class="gc-time">' + timeNow() + "</div></div>";
      } else {
        row.innerHTML = '<div><div class="gc-bubble">' + escHtml(text) + '</div><div class="gc-time">' + timeNow() + ' <span class="gc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span></div></div>';
      }
      messages.appendChild(row);
      if (type === "outgoing") {
        const chk = row.querySelector(".gc-check");
        if (chk) pendingChecks.push(chk);
      }
      requestAnimationFrame(() => scrollToBottom());
    }
    function upgradeCheck(el) {
      if (!el || el.classList.contains("delivered")) return;
      el.classList.add("delivered");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2.5");
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      poly.setAttribute("points", "20 6 9 17 4 12");
      svg.appendChild(poly);
      el.appendChild(svg);
    }
    function showTyping() {
      if (!messages) return null;
      const row = document.createElement("div");
      row.className = "gc-typing gc-msg incoming";
      row.innerHTML = '<div class="gc-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="gc-typing-dots"><span></span><span></span><span></span></div>';
      messages.appendChild(row);
      scrollToBottom();
      return row;
    }
    function removeTyping(el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    function escHtml(s) {
      const d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    }
    function timeNow() {
      const d = /* @__PURE__ */ new Date();
      return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    }
    if (startBtn) startBtn.addEventListener("click", () => {
      showStep("name");
      if (nameInput) setTimeout(() => nameInput.focus(), 400);
    });
    function beginConnection(displayName) {
      showStep("waiting");
      setStatus("connecting");
      if (window.createBrowserClient && config.contactAddress) {
        startRealChat(displayName);
      } else {
        startMockChat();
      }
    }
    if (nameGoBtn) nameGoBtn.addEventListener("click", () => {
      beginConnection(nameInput && nameInput.value.trim() || "Website Visitor");
    });
    if (guestBtn) guestBtn.addEventListener("click", () => {
      const GCC = window.GoChatClient;
      beginConnection(GCC ? GCC.generateRandomVisitorName() : "Visitor-" + Math.random().toString(36).substr(2, 4));
    });
    if (nameInput) nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (nameGoBtn) nameGoBtn.click();
      }
    });
    if (offlineBtn) offlineBtn.addEventListener("click", () => {
      offlineMode = true;
      showStep("offline");
      addMessage("Support is currently offline. Leave a message and we will get back to you.", "incoming", 0);
      if (input) setTimeout(() => input.focus(), 100);
    });
    async function startRealChat(displayName) {
      if (config.serverUrl) {
        try {
          const preflightUrl = config.serverUrl.replace("wss://", "https://").replace("ws://", "http://");
          await fetch(preflightUrl, { mode: "no-cors" });
        } catch (_) {
        }
      }
      try {
        client = window.createBrowserClient({
          contactAddress: config.contactAddress,
          serverUrl: config.serverUrl,
          displayName,
          onMessage: (text) => {
            addMessage(text, "incoming", 0);
            if (!panelOpen) incrementUnread();
          },
          onStatusChange: (status) => {
            if (status === "connected") {
              connected = true;
              setStatus("connected");
              showStep("chat");
              addMessage(config.welcome || "Connected! This chat is end-to-end encrypted via SimpleX.", "incoming", 0);
              if (input) setTimeout(() => input.focus(), 100);
            } else if (status === "pending" || status === "confirmed") {
              setStatus("waiting");
            } else if (status === "offline") {
              connected = false;
              setStatus("offline");
            } else {
              setStatus(status);
            }
          },
          onError: (err) => {
            console.error("[GoChat]", err);
            setStatus("error");
          },
          onDeliveryReceipt: () => {
            const chk = pendingChecks.shift();
            if (chk) upgradeCheck(chk);
          }
        });
        client.connect(displayName).catch((err) => {
          console.error("[GoChat] connect failed:", err);
          setStatus("error");
          showStep("start");
        });
      } catch (err) {
        console.error("[GoChat] init failed:", err);
        setStatus("error");
        showStep("start");
      }
    }
    function startMockChat() {
      setTimeout(() => {
        setStatus("waiting");
        setTimeout(() => {
          connected = true;
          setStatus("connected");
          showStep("chat");
          addMessage("Welcome! This is a demo chat.", "incoming", 0);
          setTimeout(() => addMessage("This chat is end-to-end encrypted. How can we help you?", "incoming", 0), 400);
        }, 3e3);
      }, 1200);
    }
    function sendMessage() {
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      if (!connected && !offlineMode) return;
      addMessage(text, "outgoing", 0);
      input.value = "";
      input.style.height = "auto";
      updateSendBtn();
      if (client) {
        client.send(text).catch((err) => {
          console.error("[GoChat] send failed:", err);
          addMessage("Failed to send. Please try again.", "incoming", 0);
        });
      } else {
        const typing = showTyping();
        setTimeout(() => {
          removeTyping(typing);
          addMessage(getMockReply(), "incoming", 0);
          if (!panelOpen) incrementUnread();
        }, 800 + Math.random() * 800);
      }
      if (offlineMode) {
        offlineSent = true;
        offlineMode = false;
        setTimeout(() => addMessage("Thank you! We will get back to you as soon as possible.", "incoming", 200), 300);
        if (inputArea) inputArea.classList.add("disabled");
        if (offlineEndWrap) offlineEndWrap.style.display = "flex";
      }
    }
    const REPLIES = [
      "That is a great question! Let me check with the team.",
      "Our products ship with hardware-encrypted messaging built in.",
      "You can find more details on our website.",
      "We use the SimpleX protocol for zero-metadata communication.",
      "All communication is end-to-end encrypted by default.",
      "Feel free to ask any questions!",
      "We are happy to help you."
    ];
    let replyIdx = 0;
    function getMockReply() {
      return REPLIES[replyIdx++ % REPLIES.length];
    }
    if (input) {
      input.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 120) + "px";
        updateSendBtn();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    function updateSendBtn() {
      if (!sendBtn || !input) return;
      sendBtn.classList.toggle("active", input.value.trim().length > 0);
    }
    ;
    window.GoChat = {
      open: openPanel,
      close: closePanel,
      toggle: togglePanel,
      isOpen: () => panelOpen,
      setStatus,
      addMessage,
      showTyping,
      removeTyping,
      setUnread,
      reset: resetChat
    };
    setStatus("offline");
    setUnread(0);
    showStep("start");
  }

  // src/client.ts
  var import_tweetnacl2 = __toESM(require_nacl_fast(), 1);

  // ../xftp-web/src/protocol/encoding.ts
  var Decoder = class {
    constructor(buf) {
      __publicField(this, "buf");
      __publicField(this, "view");
      __publicField(this, "pos");
      this.buf = buf;
      this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      this.pos = 0;
    }
    take(n) {
      if (this.pos + n > this.buf.length) throw new Error("Decoder: unexpected end of input");
      const slice = this.buf.subarray(this.pos, this.pos + n);
      this.pos += n;
      return slice;
    }
    takeAll() {
      const slice = this.buf.subarray(this.pos);
      this.pos = this.buf.length;
      return slice;
    }
    anyByte() {
      if (this.pos >= this.buf.length) throw new Error("Decoder: unexpected end of input");
      return this.buf[this.pos++];
    }
    remaining() {
      return this.buf.length - this.pos;
    }
    offset() {
      return this.pos;
    }
  };
  function concatBytes(...arrays) {
    let totalLen = 0;
    for (const a of arrays) totalLen += a.length;
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const a of arrays) {
      result.set(a, offset);
      offset += a.length;
    }
    return result;
  }
  function encodeWord16(n) {
    const buf = new Uint8Array(2);
    const view = new DataView(buf.buffer);
    view.setUint16(0, n, false);
    return buf;
  }
  function decodeWord16(d) {
    const bytes = d.take(2);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getUint16(0, false);
  }
  function encodeBytes(bs) {
    if (bs.length > 255) throw new Error("encodeBytes: length exceeds 255");
    const result = new Uint8Array(1 + bs.length);
    result[0] = bs.length;
    result.set(bs, 1);
    return result;
  }
  function decodeBytes(d) {
    const len = d.anyByte();
    return d.take(len);
  }
  function encodeLarge(bs) {
    if (bs.length > 65535) throw new Error("encodeLarge: length exceeds 65535");
    return concatBytes(encodeWord16(bs.length), bs);
  }
  function decodeLarge(d) {
    const len = decodeWord16(d);
    return d.take(len);
  }
  var CHAR_T = 84;
  var CHAR_F = 70;
  function encodeBool(b) {
    return new Uint8Array([b ? CHAR_T : CHAR_F]);
  }
  function decodeBool(d) {
    const byte = d.anyByte();
    if (byte === CHAR_T) return true;
    if (byte === CHAR_F) return false;
    throw new Error("decodeBool: invalid tag " + byte);
  }
  var textEncoder = new TextEncoder();
  var textDecoder = new TextDecoder();
  var CHAR_0 = 48;
  var CHAR_1 = 49;
  function encodeMaybe(encode, v) {
    if (v === null) return new Uint8Array([CHAR_0]);
    return concatBytes(new Uint8Array([CHAR_1]), encode(v));
  }
  function decodeMaybe(decode, d) {
    const tag = d.anyByte();
    if (tag === CHAR_0) return null;
    if (tag === CHAR_1) return decode(d);
    throw new Error("decodeMaybe: invalid tag " + tag);
  }
  function decodeNonEmpty(decode, d) {
    const len = d.anyByte();
    if (len === 0) throw new Error("decodeNonEmpty: empty list");
    const result = [];
    for (let i = 0; i < len; i++) result.push(decode(d));
    return result;
  }
  function encodeList(encode, xs) {
    if (xs.length > 255) throw new Error("encodeList: length exceeds 255");
    const parts = [new Uint8Array([xs.length])];
    for (const x of xs) parts.push(encode(x));
    return concatBytes(...parts);
  }
  function decodeList(decode, d) {
    const len = d.anyByte();
    const result = [];
    for (let i = 0; i < len; i++) result.push(decode(d));
    return result;
  }

  // node_modules/@noble/curves/node_modules/@noble/hashes/utils.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function anumber(n, title = "") {
    if (!Number.isSafeInteger(n) || n < 0) {
      const prefix = title && `"${title}" `;
      throw new Error(`${prefix}expected integer >= 0, got ${n}`);
    }
  }
  function abytes(value, length, title = "") {
    const bytes = isBytes(value);
    const len = value?.length;
    const needsLen = length !== void 0;
    if (!bytes || needsLen && len !== length) {
      const prefix = title && `"${title}" `;
      const ofLen = needsLen ? ` of length ${length}` : "";
      const got = bytes ? `length=${len}` : `type=${typeof value}`;
      throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
    }
    return value;
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes(out, void 0, "digestInto() output");
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error('"digestInto() output" expected to be of length >=' + min);
    }
  }
  function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
  function byteSwap(word) {
    return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
  }
  function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = byteSwap(arr[i]);
    }
    return arr;
  }
  var swap32IfBE = isLE ? (u) => u : byteSwap32;
  var hasHexBuiltin = /* @__PURE__ */ (() => (
    // @ts-ignore
    typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
  ))();
  var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
  function bytesToHex(bytes) {
    abytes(bytes);
    if (hasHexBuiltin)
      return bytes.toHex();
    let hex3 = "";
    for (let i = 0; i < bytes.length; i++) {
      hex3 += hexes[bytes[i]];
    }
    return hex3;
  }
  var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
  function asciiToBase16(ch) {
    if (ch >= asciis._0 && ch <= asciis._9)
      return ch - asciis._0;
    if (ch >= asciis.A && ch <= asciis.F)
      return ch - (asciis.A - 10);
    if (ch >= asciis.a && ch <= asciis.f)
      return ch - (asciis.a - 10);
    return;
  }
  function hexToBytes(hex3) {
    if (typeof hex3 !== "string")
      throw new Error("hex string expected, got " + typeof hex3);
    if (hasHexBuiltin)
      return Uint8Array.fromHex(hex3);
    const hl = hex3.length;
    const al = hl / 2;
    if (hl % 2)
      throw new Error("hex string expected, got unpadded hex of length " + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
      const n1 = asciiToBase16(hex3.charCodeAt(hi));
      const n2 = asciiToBase16(hex3.charCodeAt(hi + 1));
      if (n1 === void 0 || n2 === void 0) {
        const char = hex3[hi] + hex3[hi + 1];
        throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
      }
      array[ai] = n1 * 16 + n2;
    }
    return array;
  }
  function concatBytes2(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
      const a = arrays[i];
      abytes(a);
      sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad2 = 0; i < arrays.length; i++) {
      const a = arrays[i];
      res.set(a, pad2);
      pad2 += a.length;
    }
    return res;
  }
  function createHasher(hashCons, info = {}) {
    const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
    const tmp = hashCons(void 0);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
  }
  function randomBytes(bytesLength = 32) {
    const cr = typeof globalThis === "object" ? globalThis.crypto : null;
    if (typeof cr?.getRandomValues !== "function")
      throw new Error("crypto.getRandomValues must be defined");
    return cr.getRandomValues(new Uint8Array(bytesLength));
  }
  var oidNist = (suffix) => ({
    oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
  });

  // node_modules/@noble/curves/node_modules/@noble/hashes/_md.js
  var HashMD = class {
    constructor(blockLen, outputLen, padOffset, isLE3) {
      __publicField(this, "blockLen");
      __publicField(this, "outputLen");
      __publicField(this, "padOffset");
      __publicField(this, "isLE");
      // For partial updates less than block size
      __publicField(this, "buffer");
      __publicField(this, "view");
      __publicField(this, "finished", false);
      __publicField(this, "length", 0);
      __publicField(this, "pos", 0);
      __publicField(this, "destroyed", false);
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE3;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      aexists(this);
      abytes(data);
      const { view, buffer, blockLen } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const { buffer, view, blockLen, isLE: isLE3 } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      clean(this.buffer.subarray(pos));
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE3);
      this.process(view, 0);
      const oview = createView(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen must be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE3);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const { blockLen, buffer, length, finished, destroyed, pos } = this;
      to.destroyed = destroyed;
      to.finished = finished;
      to.length = length;
      to.pos = pos;
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
  };
  var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    1779033703,
    4089235720,
    3144134277,
    2227873595,
    1013904242,
    4271175723,
    2773480762,
    1595750129,
    1359893119,
    2917565137,
    2600822924,
    725511199,
    528734635,
    4215389547,
    1541459225,
    327033209
  ]);

  // node_modules/@noble/curves/node_modules/@noble/hashes/_u64.js
  var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
  var _32n = /* @__PURE__ */ BigInt(32);
  function fromBig(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
    return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const { h, l } = fromBig(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  var shrSH = (h, _l, s) => h >>> s;
  var shrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
  var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
  var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
  var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
  var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
  var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
  var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
  }
  var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
  var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
  var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
  var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
  var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
  var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

  // node_modules/@noble/curves/node_modules/@noble/hashes/sha2.js
  var K512 = /* @__PURE__ */ (() => split([
    "0x428a2f98d728ae22",
    "0x7137449123ef65cd",
    "0xb5c0fbcfec4d3b2f",
    "0xe9b5dba58189dbbc",
    "0x3956c25bf348b538",
    "0x59f111f1b605d019",
    "0x923f82a4af194f9b",
    "0xab1c5ed5da6d8118",
    "0xd807aa98a3030242",
    "0x12835b0145706fbe",
    "0x243185be4ee4b28c",
    "0x550c7dc3d5ffb4e2",
    "0x72be5d74f27b896f",
    "0x80deb1fe3b1696b1",
    "0x9bdc06a725c71235",
    "0xc19bf174cf692694",
    "0xe49b69c19ef14ad2",
    "0xefbe4786384f25e3",
    "0x0fc19dc68b8cd5b5",
    "0x240ca1cc77ac9c65",
    "0x2de92c6f592b0275",
    "0x4a7484aa6ea6e483",
    "0x5cb0a9dcbd41fbd4",
    "0x76f988da831153b5",
    "0x983e5152ee66dfab",
    "0xa831c66d2db43210",
    "0xb00327c898fb213f",
    "0xbf597fc7beef0ee4",
    "0xc6e00bf33da88fc2",
    "0xd5a79147930aa725",
    "0x06ca6351e003826f",
    "0x142929670a0e6e70",
    "0x27b70a8546d22ffc",
    "0x2e1b21385c26c926",
    "0x4d2c6dfc5ac42aed",
    "0x53380d139d95b3df",
    "0x650a73548baf63de",
    "0x766a0abb3c77b2a8",
    "0x81c2c92e47edaee6",
    "0x92722c851482353b",
    "0xa2bfe8a14cf10364",
    "0xa81a664bbc423001",
    "0xc24b8b70d0f89791",
    "0xc76c51a30654be30",
    "0xd192e819d6ef5218",
    "0xd69906245565a910",
    "0xf40e35855771202a",
    "0x106aa07032bbd1b8",
    "0x19a4c116b8d2d0c8",
    "0x1e376c085141ab53",
    "0x2748774cdf8eeb99",
    "0x34b0bcb5e19b48a8",
    "0x391c0cb3c5c95a63",
    "0x4ed8aa4ae3418acb",
    "0x5b9cca4f7763e373",
    "0x682e6ff3d6b2b8a3",
    "0x748f82ee5defb2fc",
    "0x78a5636f43172f60",
    "0x84c87814a1f0ab72",
    "0x8cc702081a6439ec",
    "0x90befffa23631e28",
    "0xa4506cebde82bde9",
    "0xbef9a3f7b2c67915",
    "0xc67178f2e372532b",
    "0xca273eceea26619c",
    "0xd186b8c721c0c207",
    "0xeada7dd6cde0eb1e",
    "0xf57d4f7fee6ed178",
    "0x06f067aa72176fba",
    "0x0a637dc5a2c898a6",
    "0x113f9804bef90dae",
    "0x1b710b35131c471b",
    "0x28db77f523047d84",
    "0x32caab7b40c72493",
    "0x3c9ebe0a15c9bebc",
    "0x431d67c49c100d4c",
    "0x4cc5d4becb3e42b6",
    "0x597f299cfc657e2a",
    "0x5fcb6fab3ad6faec",
    "0x6c44198c4a475817"
  ].map((n) => BigInt(n))))();
  var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
  var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
  var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
  var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
  var SHA2_64B = class extends HashMD {
    constructor(outputLen) {
      super(128, outputLen, 16, false);
    }
    // prettier-ignore
    get() {
      const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
      this.Ah = Ah | 0;
      this.Al = Al | 0;
      this.Bh = Bh | 0;
      this.Bl = Bl | 0;
      this.Ch = Ch | 0;
      this.Cl = Cl | 0;
      this.Dh = Dh | 0;
      this.Dl = Dl | 0;
      this.Eh = Eh | 0;
      this.El = El | 0;
      this.Fh = Fh | 0;
      this.Fl = Fl | 0;
      this.Gh = Gh | 0;
      this.Gl = Gl | 0;
      this.Hh = Hh | 0;
      this.Hl = Hl | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4) {
        SHA512_W_H[i] = view.getUint32(offset);
        SHA512_W_L[i] = view.getUint32(offset += 4);
      }
      for (let i = 16; i < 80; i++) {
        const W15h = SHA512_W_H[i - 15] | 0;
        const W15l = SHA512_W_L[i - 15] | 0;
        const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
        const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
        const W2h = SHA512_W_H[i - 2] | 0;
        const W2l = SHA512_W_L[i - 2] | 0;
        const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
        const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
        const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
        const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
        SHA512_W_H[i] = SUMh | 0;
        SHA512_W_L[i] = SUMl | 0;
      }
      let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      for (let i = 0; i < 80; i++) {
        const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
        const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
        const CHIh = Eh & Fh ^ ~Eh & Gh;
        const CHIl = El & Fl ^ ~El & Gl;
        const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
        const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
        const T1l = T1ll | 0;
        const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
        const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
        const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
        const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
        Hh = Gh | 0;
        Hl = Gl | 0;
        Gh = Fh | 0;
        Gl = Fl | 0;
        Fh = Eh | 0;
        Fl = El | 0;
        ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
        Dh = Ch | 0;
        Dl = Cl | 0;
        Ch = Bh | 0;
        Cl = Bl | 0;
        Bh = Ah | 0;
        Bl = Al | 0;
        const All = add3L(T1l, sigma0l, MAJl);
        Ah = add3H(All, T1h, sigma0h, MAJh);
        Al = All | 0;
      }
      ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
      ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
      ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
      ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
      ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
      ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
      ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
      ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
      this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
      clean(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
      clean(this.buffer);
      this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  };
  var _SHA512 = class extends SHA2_64B {
    constructor() {
      super(64);
      __publicField(this, "Ah", SHA512_IV[0] | 0);
      __publicField(this, "Al", SHA512_IV[1] | 0);
      __publicField(this, "Bh", SHA512_IV[2] | 0);
      __publicField(this, "Bl", SHA512_IV[3] | 0);
      __publicField(this, "Ch", SHA512_IV[4] | 0);
      __publicField(this, "Cl", SHA512_IV[5] | 0);
      __publicField(this, "Dh", SHA512_IV[6] | 0);
      __publicField(this, "Dl", SHA512_IV[7] | 0);
      __publicField(this, "Eh", SHA512_IV[8] | 0);
      __publicField(this, "El", SHA512_IV[9] | 0);
      __publicField(this, "Fh", SHA512_IV[10] | 0);
      __publicField(this, "Fl", SHA512_IV[11] | 0);
      __publicField(this, "Gh", SHA512_IV[12] | 0);
      __publicField(this, "Gl", SHA512_IV[13] | 0);
      __publicField(this, "Hh", SHA512_IV[14] | 0);
      __publicField(this, "Hl", SHA512_IV[15] | 0);
    }
  };
  var sha512 = /* @__PURE__ */ createHasher(
    () => new _SHA512(),
    /* @__PURE__ */ oidNist(3)
  );

  // node_modules/@noble/curves/utils.js
  var _0n = /* @__PURE__ */ BigInt(0);
  var _1n = /* @__PURE__ */ BigInt(1);
  function abool(value, title = "") {
    if (typeof value !== "boolean") {
      const prefix = title && `"${title}" `;
      throw new Error(prefix + "expected boolean, got type=" + typeof value);
    }
    return value;
  }
  function abignumber(n) {
    if (typeof n === "bigint") {
      if (!isPosBig(n))
        throw new Error("positive bigint expected, got " + n);
    } else
      anumber(n);
    return n;
  }
  function hexToNumber(hex3) {
    if (typeof hex3 !== "string")
      throw new Error("hex string expected, got " + typeof hex3);
    return hex3 === "" ? _0n : BigInt("0x" + hex3);
  }
  function bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex(bytes));
  }
  function bytesToNumberLE(bytes) {
    return hexToNumber(bytesToHex(copyBytes(abytes(bytes)).reverse()));
  }
  function numberToBytesBE(n, len) {
    anumber(len);
    n = abignumber(n);
    const res = hexToBytes(n.toString(16).padStart(len * 2, "0"));
    if (res.length !== len)
      throw new Error("number too large");
    return res;
  }
  function numberToBytesLE(n, len) {
    return numberToBytesBE(n, len).reverse();
  }
  function copyBytes(bytes) {
    return Uint8Array.from(bytes);
  }
  function asciiToBytes(ascii2) {
    return Uint8Array.from(ascii2, (c, i) => {
      const charCode = c.charCodeAt(0);
      if (c.length !== 1 || charCode > 127) {
        throw new Error(`string contains non-ASCII character "${ascii2[i]}" with code ${charCode} at position ${i}`);
      }
      return charCode;
    });
  }
  var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
  function inRange(n, min, max) {
    return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
  }
  function aInRange(title, n, min, max) {
    if (!inRange(n, min, max))
      throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
  }
  var bitMask = (n) => (_1n << BigInt(n)) - _1n;
  function validateObject(object, fields = {}, optFields = {}) {
    if (!object || typeof object !== "object")
      throw new Error("expected valid options object");
    function checkField(fieldName, expectedType, isOpt) {
      const val = object[fieldName];
      if (isOpt && val === void 0)
        return;
      const current = typeof val;
      if (current !== expectedType || val === null)
        throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
    }
    const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
    iter(fields, false);
    iter(optFields, true);
  }
  function memoized(fn) {
    const map = /* @__PURE__ */ new WeakMap();
    return (arg, ...args) => {
      const val = map.get(arg);
      if (val !== void 0)
        return val;
      const computed = fn(arg, ...args);
      map.set(arg, computed);
      return computed;
    };
  }

  // node_modules/@noble/curves/abstract/modular.js
  var _0n2 = /* @__PURE__ */ BigInt(0);
  var _1n2 = /* @__PURE__ */ BigInt(1);
  var _2n = /* @__PURE__ */ BigInt(2);
  var _3n = /* @__PURE__ */ BigInt(3);
  var _4n = /* @__PURE__ */ BigInt(4);
  var _5n = /* @__PURE__ */ BigInt(5);
  var _7n = /* @__PURE__ */ BigInt(7);
  var _8n = /* @__PURE__ */ BigInt(8);
  var _9n = /* @__PURE__ */ BigInt(9);
  var _16n = /* @__PURE__ */ BigInt(16);
  function mod(a, b) {
    const result = a % b;
    return result >= _0n2 ? result : b + result;
  }
  function pow2(x, power, modulo) {
    let res = x;
    while (power-- > _0n2) {
      res *= res;
      res %= modulo;
    }
    return res;
  }
  function invert(number, modulo) {
    if (number === _0n2)
      throw new Error("invert: expected non-zero number");
    if (modulo <= _0n2)
      throw new Error("invert: expected positive modulus, got " + modulo);
    let a = mod(number, modulo);
    let b = modulo;
    let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
    while (a !== _0n2) {
      const q = b / a;
      const r = b % a;
      const m = x - u * q;
      const n = y - v * q;
      b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd = b;
    if (gcd !== _1n2)
      throw new Error("invert: does not exist");
    return mod(x, modulo);
  }
  function assertIsSquare(Fp2, root, n) {
    if (!Fp2.eql(Fp2.sqr(root), n))
      throw new Error("Cannot find square root");
  }
  function sqrt3mod4(Fp2, n) {
    const p1div4 = (Fp2.ORDER + _1n2) / _4n;
    const root = Fp2.pow(n, p1div4);
    assertIsSquare(Fp2, root, n);
    return root;
  }
  function sqrt5mod8(Fp2, n) {
    const p5div8 = (Fp2.ORDER - _5n) / _8n;
    const n2 = Fp2.mul(n, _2n);
    const v = Fp2.pow(n2, p5div8);
    const nv = Fp2.mul(n, v);
    const i = Fp2.mul(Fp2.mul(nv, _2n), v);
    const root = Fp2.mul(nv, Fp2.sub(i, Fp2.ONE));
    assertIsSquare(Fp2, root, n);
    return root;
  }
  function sqrt9mod16(P) {
    const Fp_ = Field(P);
    const tn = tonelliShanks(P);
    const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
    const c2 = tn(Fp_, c1);
    const c3 = tn(Fp_, Fp_.neg(c1));
    const c4 = (P + _7n) / _16n;
    return (Fp2, n) => {
      let tv1 = Fp2.pow(n, c4);
      let tv2 = Fp2.mul(tv1, c1);
      const tv3 = Fp2.mul(tv1, c2);
      const tv4 = Fp2.mul(tv1, c3);
      const e1 = Fp2.eql(Fp2.sqr(tv2), n);
      const e2 = Fp2.eql(Fp2.sqr(tv3), n);
      tv1 = Fp2.cmov(tv1, tv2, e1);
      tv2 = Fp2.cmov(tv4, tv3, e2);
      const e3 = Fp2.eql(Fp2.sqr(tv2), n);
      const root = Fp2.cmov(tv1, tv2, e3);
      assertIsSquare(Fp2, root, n);
      return root;
    };
  }
  function tonelliShanks(P) {
    if (P < _3n)
      throw new Error("sqrt is not defined for small field");
    let Q = P - _1n2;
    let S = 0;
    while (Q % _2n === _0n2) {
      Q /= _2n;
      S++;
    }
    let Z = _2n;
    const _Fp = Field(P);
    while (FpLegendre(_Fp, Z) === 1) {
      if (Z++ > 1e3)
        throw new Error("Cannot find square root: probably non-prime P");
    }
    if (S === 1)
      return sqrt3mod4;
    let cc = _Fp.pow(Z, Q);
    const Q1div2 = (Q + _1n2) / _2n;
    return function tonelliSlow(Fp2, n) {
      if (Fp2.is0(n))
        return n;
      if (FpLegendre(Fp2, n) !== 1)
        throw new Error("Cannot find square root");
      let M = S;
      let c = Fp2.mul(Fp2.ONE, cc);
      let t = Fp2.pow(n, Q);
      let R = Fp2.pow(n, Q1div2);
      while (!Fp2.eql(t, Fp2.ONE)) {
        if (Fp2.is0(t))
          return Fp2.ZERO;
        let i = 1;
        let t_tmp = Fp2.sqr(t);
        while (!Fp2.eql(t_tmp, Fp2.ONE)) {
          i++;
          t_tmp = Fp2.sqr(t_tmp);
          if (i === M)
            throw new Error("Cannot find square root");
        }
        const exponent = _1n2 << BigInt(M - i - 1);
        const b = Fp2.pow(c, exponent);
        M = i;
        c = Fp2.sqr(b);
        t = Fp2.mul(t, c);
        R = Fp2.mul(R, b);
      }
      return R;
    };
  }
  function FpSqrt(P) {
    if (P % _4n === _3n)
      return sqrt3mod4;
    if (P % _8n === _5n)
      return sqrt5mod8;
    if (P % _16n === _9n)
      return sqrt9mod16(P);
    return tonelliShanks(P);
  }
  var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
  var FIELD_FIELDS = [
    "create",
    "isValid",
    "is0",
    "neg",
    "inv",
    "sqrt",
    "sqr",
    "eql",
    "add",
    "sub",
    "mul",
    "pow",
    "div",
    "addN",
    "subN",
    "mulN",
    "sqrN"
  ];
  function validateField(field) {
    const initial = {
      ORDER: "bigint",
      BYTES: "number",
      BITS: "number"
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
      map[val] = "function";
      return map;
    }, initial);
    validateObject(field, opts);
    return field;
  }
  function FpPow(Fp2, num, power) {
    if (power < _0n2)
      throw new Error("invalid exponent, negatives unsupported");
    if (power === _0n2)
      return Fp2.ONE;
    if (power === _1n2)
      return num;
    let p = Fp2.ONE;
    let d = num;
    while (power > _0n2) {
      if (power & _1n2)
        p = Fp2.mul(p, d);
      d = Fp2.sqr(d);
      power >>= _1n2;
    }
    return p;
  }
  function FpInvertBatch(Fp2, nums, passZero = false) {
    const inverted = new Array(nums.length).fill(passZero ? Fp2.ZERO : void 0);
    const multipliedAcc = nums.reduce((acc, num, i) => {
      if (Fp2.is0(num))
        return acc;
      inverted[i] = acc;
      return Fp2.mul(acc, num);
    }, Fp2.ONE);
    const invertedAcc = Fp2.inv(multipliedAcc);
    nums.reduceRight((acc, num, i) => {
      if (Fp2.is0(num))
        return acc;
      inverted[i] = Fp2.mul(acc, inverted[i]);
      return Fp2.mul(acc, num);
    }, invertedAcc);
    return inverted;
  }
  function FpLegendre(Fp2, n) {
    const p1mod2 = (Fp2.ORDER - _1n2) / _2n;
    const powered = Fp2.pow(n, p1mod2);
    const yes = Fp2.eql(powered, Fp2.ONE);
    const zero = Fp2.eql(powered, Fp2.ZERO);
    const no = Fp2.eql(powered, Fp2.neg(Fp2.ONE));
    if (!yes && !zero && !no)
      throw new Error("invalid Legendre symbol result");
    return yes ? 1 : zero ? 0 : -1;
  }
  function nLength(n, nBitLength) {
    if (nBitLength !== void 0)
      anumber(nBitLength);
    const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
  }
  var _Field = class {
    constructor(ORDER, opts = {}) {
      __publicField(this, "ORDER");
      __publicField(this, "BITS");
      __publicField(this, "BYTES");
      __publicField(this, "isLE");
      __publicField(this, "ZERO", _0n2);
      __publicField(this, "ONE", _1n2);
      __publicField(this, "_lengths");
      __publicField(this, "_sqrt");
      // cached sqrt
      __publicField(this, "_mod");
      if (ORDER <= _0n2)
        throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
      let _nbitLength = void 0;
      this.isLE = false;
      if (opts != null && typeof opts === "object") {
        if (typeof opts.BITS === "number")
          _nbitLength = opts.BITS;
        if (typeof opts.sqrt === "function")
          this.sqrt = opts.sqrt;
        if (typeof opts.isLE === "boolean")
          this.isLE = opts.isLE;
        if (opts.allowedLengths)
          this._lengths = opts.allowedLengths?.slice();
        if (typeof opts.modFromBytes === "boolean")
          this._mod = opts.modFromBytes;
      }
      const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
      if (nByteLength > 2048)
        throw new Error("invalid field: expected ORDER of <= 2048 bytes");
      this.ORDER = ORDER;
      this.BITS = nBitLength;
      this.BYTES = nByteLength;
      this._sqrt = void 0;
      Object.preventExtensions(this);
    }
    create(num) {
      return mod(num, this.ORDER);
    }
    isValid(num) {
      if (typeof num !== "bigint")
        throw new Error("invalid field element: expected bigint, got " + typeof num);
      return _0n2 <= num && num < this.ORDER;
    }
    is0(num) {
      return num === _0n2;
    }
    // is valid and invertible
    isValidNot0(num) {
      return !this.is0(num) && this.isValid(num);
    }
    isOdd(num) {
      return (num & _1n2) === _1n2;
    }
    neg(num) {
      return mod(-num, this.ORDER);
    }
    eql(lhs, rhs) {
      return lhs === rhs;
    }
    sqr(num) {
      return mod(num * num, this.ORDER);
    }
    add(lhs, rhs) {
      return mod(lhs + rhs, this.ORDER);
    }
    sub(lhs, rhs) {
      return mod(lhs - rhs, this.ORDER);
    }
    mul(lhs, rhs) {
      return mod(lhs * rhs, this.ORDER);
    }
    pow(num, power) {
      return FpPow(this, num, power);
    }
    div(lhs, rhs) {
      return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
    }
    // Same as above, but doesn't normalize
    sqrN(num) {
      return num * num;
    }
    addN(lhs, rhs) {
      return lhs + rhs;
    }
    subN(lhs, rhs) {
      return lhs - rhs;
    }
    mulN(lhs, rhs) {
      return lhs * rhs;
    }
    inv(num) {
      return invert(num, this.ORDER);
    }
    sqrt(num) {
      if (!this._sqrt)
        this._sqrt = FpSqrt(this.ORDER);
      return this._sqrt(this, num);
    }
    toBytes(num) {
      return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE(num, this.BYTES);
    }
    fromBytes(bytes, skipValidation = false) {
      abytes(bytes);
      const { _lengths: allowedLengths, BYTES, isLE: isLE3, ORDER, _mod: modFromBytes } = this;
      if (allowedLengths) {
        if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
          throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
        }
        const padded = new Uint8Array(BYTES);
        padded.set(bytes, isLE3 ? 0 : padded.length - bytes.length);
        bytes = padded;
      }
      if (bytes.length !== BYTES)
        throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
      let scalar = isLE3 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
      if (modFromBytes)
        scalar = mod(scalar, ORDER);
      if (!skipValidation) {
        if (!this.isValid(scalar))
          throw new Error("invalid field element: outside of range 0..ORDER");
      }
      return scalar;
    }
    // TODO: we don't need it here, move out to separate fn
    invertBatch(lst) {
      return FpInvertBatch(this, lst);
    }
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov(a, b, condition) {
      return condition ? b : a;
    }
  };
  function Field(ORDER, opts = {}) {
    return new _Field(ORDER, opts);
  }

  // node_modules/@noble/curves/abstract/curve.js
  var _0n3 = /* @__PURE__ */ BigInt(0);
  var _1n3 = /* @__PURE__ */ BigInt(1);
  function negateCt(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
  }
  function normalizeZ(c, points) {
    const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
    return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
  }
  function validateW(W, bits) {
    if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
      throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
  }
  function calcWOpts(W, scalarBits) {
    validateW(W, scalarBits);
    const windows = Math.ceil(scalarBits / W) + 1;
    const windowSize = 2 ** (W - 1);
    const maxNumber = 2 ** W;
    const mask = bitMask(W);
    const shiftBy = BigInt(W);
    return { windows, windowSize, mask, maxNumber, shiftBy };
  }
  function calcOffsets(n, window2, wOpts) {
    const { windowSize, mask, maxNumber, shiftBy } = wOpts;
    let wbits = Number(n & mask);
    let nextN = n >> shiftBy;
    if (wbits > windowSize) {
      wbits -= maxNumber;
      nextN += _1n3;
    }
    const offsetStart = window2 * windowSize;
    const offset = offsetStart + Math.abs(wbits) - 1;
    const isZero = wbits === 0;
    const isNeg = wbits < 0;
    const isNegF = window2 % 2 !== 0;
    const offsetF = offsetStart;
    return { nextN, offset, isZero, isNeg, isNegF, offsetF };
  }
  var pointPrecomputes = /* @__PURE__ */ new WeakMap();
  var pointWindowSizes = /* @__PURE__ */ new WeakMap();
  function getW(P) {
    return pointWindowSizes.get(P) || 1;
  }
  function assert0(n) {
    if (n !== _0n3)
      throw new Error("invalid wNAF");
  }
  var wNAF = class {
    // Parametrized with a given Point class (not individual point)
    constructor(Point, bits) {
      __publicField(this, "BASE");
      __publicField(this, "ZERO");
      __publicField(this, "Fn");
      __publicField(this, "bits");
      this.BASE = Point.BASE;
      this.ZERO = Point.ZERO;
      this.Fn = Point.Fn;
      this.bits = bits;
    }
    // non-const time multiplication ladder
    _unsafeLadder(elm, n, p = this.ZERO) {
      let d = elm;
      while (n > _0n3) {
        if (n & _1n3)
          p = p.add(d);
        d = d.double();
        n >>= _1n3;
      }
      return p;
    }
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @param point Point instance
     * @param W window size
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(point, W) {
      const { windows, windowSize } = calcWOpts(W, this.bits);
      const points = [];
      let p = point;
      let base = p;
      for (let window2 = 0; window2 < windows; window2++) {
        base = p;
        points.push(base);
        for (let i = 1; i < windowSize; i++) {
          base = base.add(p);
          points.push(base);
        }
        p = base.double();
      }
      return points;
    }
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * More compact implementation:
     * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
     * @returns real and fake (for const-time) points
     */
    wNAF(W, precomputes, n) {
      if (!this.Fn.isValid(n))
        throw new Error("invalid scalar");
      let p = this.ZERO;
      let f = this.BASE;
      const wo = calcWOpts(W, this.bits);
      for (let window2 = 0; window2 < wo.windows; window2++) {
        const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
        n = nextN;
        if (isZero) {
          f = f.add(negateCt(isNegF, precomputes[offsetF]));
        } else {
          p = p.add(negateCt(isNeg, precomputes[offset]));
        }
      }
      assert0(n);
      return { p, f };
    }
    /**
     * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
     * @param acc accumulator point to add result of multiplication
     * @returns point
     */
    wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
      const wo = calcWOpts(W, this.bits);
      for (let window2 = 0; window2 < wo.windows; window2++) {
        if (n === _0n3)
          break;
        const { nextN, offset, isZero, isNeg } = calcOffsets(n, window2, wo);
        n = nextN;
        if (isZero) {
          continue;
        } else {
          const item = precomputes[offset];
          acc = acc.add(isNeg ? item.negate() : item);
        }
      }
      assert0(n);
      return acc;
    }
    getPrecomputes(W, point, transform) {
      let comp = pointPrecomputes.get(point);
      if (!comp) {
        comp = this.precomputeWindow(point, W);
        if (W !== 1) {
          if (typeof transform === "function")
            comp = transform(comp);
          pointPrecomputes.set(point, comp);
        }
      }
      return comp;
    }
    cached(point, scalar, transform) {
      const W = getW(point);
      return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
    }
    unsafe(point, scalar, transform, prev) {
      const W = getW(point);
      if (W === 1)
        return this._unsafeLadder(point, scalar, prev);
      return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
    }
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    createCache(P, W) {
      validateW(W, this.bits);
      pointWindowSizes.set(P, W);
      pointPrecomputes.delete(P);
    }
    hasCache(elm) {
      return getW(elm) !== 1;
    }
  };
  function createField(order, field, isLE3) {
    if (field) {
      if (field.ORDER !== order)
        throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
      validateField(field);
      return field;
    } else {
      return Field(order, { isLE: isLE3 });
    }
  }
  function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
    if (FpFnLE === void 0)
      FpFnLE = type === "edwards";
    if (!CURVE || typeof CURVE !== "object")
      throw new Error(`expected valid ${type} CURVE object`);
    for (const p of ["p", "n", "h"]) {
      const val = CURVE[p];
      if (!(typeof val === "bigint" && val > _0n3))
        throw new Error(`CURVE.${p} must be positive bigint`);
    }
    const Fp2 = createField(CURVE.p, curveOpts.Fp, FpFnLE);
    const Fn2 = createField(CURVE.n, curveOpts.Fn, FpFnLE);
    const _b = type === "weierstrass" ? "b" : "d";
    const params = ["Gx", "Gy", "a", _b];
    for (const p of params) {
      if (!Fp2.isValid(CURVE[p]))
        throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
    }
    CURVE = Object.freeze(Object.assign({}, CURVE));
    return { CURVE, Fp: Fp2, Fn: Fn2 };
  }
  function createKeygen(randomSecretKey, getPublicKey) {
    return function keygen(seed) {
      const secretKey = randomSecretKey(seed);
      return { secretKey, publicKey: getPublicKey(secretKey) };
    };
  }

  // node_modules/@noble/curves/abstract/edwards.js
  var _0n4 = BigInt(0);
  var _1n4 = BigInt(1);
  var _2n2 = BigInt(2);
  var _8n2 = BigInt(8);
  function isEdValidXY(Fp2, CURVE, x, y) {
    const x2 = Fp2.sqr(x);
    const y2 = Fp2.sqr(y);
    const left = Fp2.add(Fp2.mul(CURVE.a, x2), y2);
    const right = Fp2.add(Fp2.ONE, Fp2.mul(CURVE.d, Fp2.mul(x2, y2)));
    return Fp2.eql(left, right);
  }
  function edwards(params, extraOpts = {}) {
    const validated = createCurveFields("edwards", params, extraOpts, extraOpts.FpFnLE);
    const { Fp: Fp2, Fn: Fn2 } = validated;
    let CURVE = validated.CURVE;
    const { h: cofactor } = CURVE;
    validateObject(extraOpts, {}, { uvRatio: "function" });
    const MASK = _2n2 << BigInt(Fn2.BYTES * 8) - _1n4;
    const modP = (n) => Fp2.create(n);
    const uvRatio3 = extraOpts.uvRatio || ((u, v) => {
      try {
        return { isValid: true, value: Fp2.sqrt(Fp2.div(u, v)) };
      } catch (e) {
        return { isValid: false, value: _0n4 };
      }
    });
    if (!isEdValidXY(Fp2, CURVE, CURVE.Gx, CURVE.Gy))
      throw new Error("bad curve params: generator point");
    function acoord(title, n, banZero = false) {
      const min = banZero ? _1n4 : _0n4;
      aInRange("coordinate " + title, n, min, MASK);
      return n;
    }
    function aedpoint(other) {
      if (!(other instanceof Point))
        throw new Error("EdwardsPoint expected");
    }
    const toAffineMemo = memoized((p, iz) => {
      const { X, Y, Z } = p;
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? _8n2 : Fp2.inv(Z);
      const x = modP(X * iz);
      const y = modP(Y * iz);
      const zz = Fp2.mul(Z, iz);
      if (is0)
        return { x: _0n4, y: _1n4 };
      if (zz !== _1n4)
        throw new Error("invZ was invalid");
      return { x, y };
    });
    const assertValidMemo = memoized((p) => {
      const { a, d } = CURVE;
      if (p.is0())
        throw new Error("bad point: ZERO");
      const { X, Y, Z, T } = p;
      const X2 = modP(X * X);
      const Y2 = modP(Y * Y);
      const Z2 = modP(Z * Z);
      const Z4 = modP(Z2 * Z2);
      const aX2 = modP(X2 * a);
      const left = modP(Z2 * modP(aX2 + Y2));
      const right = modP(Z4 + modP(d * modP(X2 * Y2)));
      if (left !== right)
        throw new Error("bad point: equation left != right (1)");
      const XY = modP(X * Y);
      const ZT = modP(Z * T);
      if (XY !== ZT)
        throw new Error("bad point: equation left != right (2)");
      return true;
    });
    const _Point = class _Point {
      constructor(X, Y, Z, T) {
        __publicField(this, "X");
        __publicField(this, "Y");
        __publicField(this, "Z");
        __publicField(this, "T");
        this.X = acoord("x", X);
        this.Y = acoord("y", Y);
        this.Z = acoord("z", Z, true);
        this.T = acoord("t", T);
        Object.freeze(this);
      }
      static CURVE() {
        return CURVE;
      }
      static fromAffine(p) {
        if (p instanceof _Point)
          throw new Error("extended point not allowed");
        const { x, y } = p || {};
        acoord("x", x);
        acoord("y", y);
        return new _Point(x, y, _1n4, modP(x * y));
      }
      // Uses algo from RFC8032 5.1.3.
      static fromBytes(bytes, zip215 = false) {
        const len = Fp2.BYTES;
        const { a, d } = CURVE;
        bytes = copyBytes(abytes(bytes, len, "point"));
        abool(zip215, "zip215");
        const normed = copyBytes(bytes);
        const lastByte = bytes[len - 1];
        normed[len - 1] = lastByte & ~128;
        const y = bytesToNumberLE(normed);
        const max = zip215 ? MASK : Fp2.ORDER;
        aInRange("point.y", y, _0n4, max);
        const y2 = modP(y * y);
        const u = modP(y2 - _1n4);
        const v = modP(d * y2 - a);
        let { isValid, value: x } = uvRatio3(u, v);
        if (!isValid)
          throw new Error("bad point: invalid y coordinate");
        const isXOdd = (x & _1n4) === _1n4;
        const isLastByteOdd = (lastByte & 128) !== 0;
        if (!zip215 && x === _0n4 && isLastByteOdd)
          throw new Error("bad point: x=0 and x_0=1");
        if (isLastByteOdd !== isXOdd)
          x = modP(-x);
        return _Point.fromAffine({ x, y });
      }
      static fromHex(hex3, zip215 = false) {
        return _Point.fromBytes(hexToBytes(hex3), zip215);
      }
      get x() {
        return this.toAffine().x;
      }
      get y() {
        return this.toAffine().y;
      }
      precompute(windowSize = 8, isLazy = true) {
        wnaf.createCache(this, windowSize);
        if (!isLazy)
          this.multiply(_2n2);
        return this;
      }
      // Useful in fromAffine() - not for fromBytes(), which always created valid points.
      assertValidity() {
        assertValidMemo(this);
      }
      // Compare one point to another.
      equals(other) {
        aedpoint(other);
        const { X: X1, Y: Y1, Z: Z1 } = this;
        const { X: X2, Y: Y2, Z: Z2 } = other;
        const X1Z2 = modP(X1 * Z2);
        const X2Z1 = modP(X2 * Z1);
        const Y1Z2 = modP(Y1 * Z2);
        const Y2Z1 = modP(Y2 * Z1);
        return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
      }
      is0() {
        return this.equals(_Point.ZERO);
      }
      negate() {
        return new _Point(modP(-this.X), this.Y, this.Z, modP(-this.T));
      }
      // Fast algo for doubling Extended Point.
      // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
      // Cost: 4M + 4S + 1*a + 6add + 1*2.
      double() {
        const { a } = CURVE;
        const { X: X1, Y: Y1, Z: Z1 } = this;
        const A = modP(X1 * X1);
        const B = modP(Y1 * Y1);
        const C = modP(_2n2 * modP(Z1 * Z1));
        const D = modP(a * A);
        const x1y1 = X1 + Y1;
        const E = modP(modP(x1y1 * x1y1) - A - B);
        const G = D + B;
        const F = G - C;
        const H = D - B;
        const X3 = modP(E * F);
        const Y3 = modP(G * H);
        const T3 = modP(E * H);
        const Z3 = modP(F * G);
        return new _Point(X3, Y3, Z3, T3);
      }
      // Fast algo for adding 2 Extended Points.
      // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
      // Cost: 9M + 1*a + 1*d + 7add.
      add(other) {
        aedpoint(other);
        const { a, d } = CURVE;
        const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
        const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
        const A = modP(X1 * X2);
        const B = modP(Y1 * Y2);
        const C = modP(T1 * d * T2);
        const D = modP(Z1 * Z2);
        const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
        const F = D - C;
        const G = D + C;
        const H = modP(B - a * A);
        const X3 = modP(E * F);
        const Y3 = modP(G * H);
        const T3 = modP(E * H);
        const Z3 = modP(F * G);
        return new _Point(X3, Y3, Z3, T3);
      }
      subtract(other) {
        return this.add(other.negate());
      }
      // Constant-time multiplication.
      multiply(scalar) {
        if (!Fn2.isValidNot0(scalar))
          throw new Error("invalid scalar: expected 1 <= sc < curve.n");
        const { p, f } = wnaf.cached(this, scalar, (p2) => normalizeZ(_Point, p2));
        return normalizeZ(_Point, [p, f])[0];
      }
      // Non-constant-time multiplication. Uses double-and-add algorithm.
      // It's faster, but should only be used when you don't care about
      // an exposed private key e.g. sig verification.
      // Does NOT allow scalars higher than CURVE.n.
      // Accepts optional accumulator to merge with multiply (important for sparse scalars)
      multiplyUnsafe(scalar, acc = _Point.ZERO) {
        if (!Fn2.isValid(scalar))
          throw new Error("invalid scalar: expected 0 <= sc < curve.n");
        if (scalar === _0n4)
          return _Point.ZERO;
        if (this.is0() || scalar === _1n4)
          return this;
        return wnaf.unsafe(this, scalar, (p) => normalizeZ(_Point, p), acc);
      }
      // Checks if point is of small order.
      // If you add something to small order point, you will have "dirty"
      // point with torsion component.
      // Multiplies point by cofactor and checks if the result is 0.
      isSmallOrder() {
        return this.multiplyUnsafe(cofactor).is0();
      }
      // Multiplies point by curve order and checks if the result is 0.
      // Returns `false` is the point is dirty.
      isTorsionFree() {
        return wnaf.unsafe(this, CURVE.n).is0();
      }
      // Converts Extended point to default (x, y) coordinates.
      // Can accept precomputed Z^-1 - for example, from invertBatch.
      toAffine(invertedZ) {
        return toAffineMemo(this, invertedZ);
      }
      clearCofactor() {
        if (cofactor === _1n4)
          return this;
        return this.multiplyUnsafe(cofactor);
      }
      toBytes() {
        const { x, y } = this.toAffine();
        const bytes = Fp2.toBytes(y);
        bytes[bytes.length - 1] |= x & _1n4 ? 128 : 0;
        return bytes;
      }
      toHex() {
        return bytesToHex(this.toBytes());
      }
      toString() {
        return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
      }
    };
    // base / generator point
    __publicField(_Point, "BASE", new _Point(CURVE.Gx, CURVE.Gy, _1n4, modP(CURVE.Gx * CURVE.Gy)));
    // zero / infinity / identity point
    __publicField(_Point, "ZERO", new _Point(_0n4, _1n4, _1n4, _0n4));
    // 0, 1, 1, 0
    // math field
    __publicField(_Point, "Fp", Fp2);
    // scalar field
    __publicField(_Point, "Fn", Fn2);
    let Point = _Point;
    const wnaf = new wNAF(Point, Fn2.BITS);
    Point.BASE.precompute(8);
    return Point;
  }
  function eddsa(Point, cHash, eddsaOpts = {}) {
    if (typeof cHash !== "function")
      throw new Error('"hash" function param is required');
    validateObject(eddsaOpts, {}, {
      adjustScalarBytes: "function",
      randomBytes: "function",
      domain: "function",
      prehash: "function",
      mapToCurve: "function"
    });
    const { prehash } = eddsaOpts;
    const { BASE, Fp: Fp2, Fn: Fn2 } = Point;
    const randomBytes3 = eddsaOpts.randomBytes || randomBytes;
    const adjustScalarBytes3 = eddsaOpts.adjustScalarBytes || ((bytes) => bytes);
    const domain = eddsaOpts.domain || ((data, ctx, phflag) => {
      abool(phflag, "phflag");
      if (ctx.length || phflag)
        throw new Error("Contexts/pre-hash are not supported");
      return data;
    });
    function modN_LE(hash) {
      return Fn2.create(bytesToNumberLE(hash));
    }
    function getPrivateScalar(key) {
      const len = lengths.secretKey;
      abytes(key, lengths.secretKey, "secretKey");
      const hashed = abytes(cHash(key), 2 * len, "hashedSecretKey");
      const head = adjustScalarBytes3(hashed.slice(0, len));
      const prefix = hashed.slice(len, 2 * len);
      const scalar = modN_LE(head);
      return { head, prefix, scalar };
    }
    function getExtendedPublicKey(secretKey) {
      const { head, prefix, scalar } = getPrivateScalar(secretKey);
      const point = BASE.multiply(scalar);
      const pointBytes = point.toBytes();
      return { head, prefix, scalar, point, pointBytes };
    }
    function getPublicKey(secretKey) {
      return getExtendedPublicKey(secretKey).pointBytes;
    }
    function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
      const msg = concatBytes2(...msgs);
      return modN_LE(cHash(domain(msg, abytes(context, void 0, "context"), !!prehash)));
    }
    function sign(msg, secretKey, options = {}) {
      msg = abytes(msg, void 0, "message");
      if (prehash)
        msg = prehash(msg);
      const { prefix, scalar, pointBytes } = getExtendedPublicKey(secretKey);
      const r = hashDomainToScalar(options.context, prefix, msg);
      const R = BASE.multiply(r).toBytes();
      const k = hashDomainToScalar(options.context, R, pointBytes, msg);
      const s = Fn2.create(r + k * scalar);
      if (!Fn2.isValid(s))
        throw new Error("sign failed: invalid s");
      const rs = concatBytes2(R, Fn2.toBytes(s));
      return abytes(rs, lengths.signature, "result");
    }
    const verifyOpts = { zip215: true };
    function verify(sig, msg, publicKey, options = verifyOpts) {
      const { context, zip215 } = options;
      const len = lengths.signature;
      sig = abytes(sig, len, "signature");
      msg = abytes(msg, void 0, "message");
      publicKey = abytes(publicKey, lengths.publicKey, "publicKey");
      if (zip215 !== void 0)
        abool(zip215, "zip215");
      if (prehash)
        msg = prehash(msg);
      const mid = len / 2;
      const r = sig.subarray(0, mid);
      const s = bytesToNumberLE(sig.subarray(mid, len));
      let A, R, SB;
      try {
        A = Point.fromBytes(publicKey, zip215);
        R = Point.fromBytes(r, zip215);
        SB = BASE.multiplyUnsafe(s);
      } catch (error) {
        return false;
      }
      if (!zip215 && A.isSmallOrder())
        return false;
      const k = hashDomainToScalar(context, R.toBytes(), A.toBytes(), msg);
      const RkA = R.add(A.multiplyUnsafe(k));
      return RkA.subtract(SB).clearCofactor().is0();
    }
    const _size = Fp2.BYTES;
    const lengths = {
      secretKey: _size,
      publicKey: _size,
      signature: 2 * _size,
      seed: _size
    };
    function randomSecretKey(seed = randomBytes3(lengths.seed)) {
      return abytes(seed, lengths.seed, "seed");
    }
    function isValidSecretKey(key) {
      return isBytes(key) && key.length === Fn2.BYTES;
    }
    function isValidPublicKey(key, zip215) {
      try {
        return !!Point.fromBytes(key, zip215);
      } catch (error) {
        return false;
      }
    }
    const utils = {
      getExtendedPublicKey,
      randomSecretKey,
      isValidSecretKey,
      isValidPublicKey,
      /**
       * Converts ed public key to x public key. Uses formula:
       * - ed25519:
       *   - `(u, v) = ((1+y)/(1-y), sqrt(-486664)*u/x)`
       *   - `(x, y) = (sqrt(-486664)*u/v, (u-1)/(u+1))`
       * - ed448:
       *   - `(u, v) = ((y-1)/(y+1), sqrt(156324)*u/x)`
       *   - `(x, y) = (sqrt(156324)*u/v, (1+u)/(1-u))`
       */
      toMontgomery(publicKey) {
        const { y } = Point.fromBytes(publicKey);
        const size = lengths.publicKey;
        const is25519 = size === 32;
        if (!is25519 && size !== 57)
          throw new Error("only defined for 25519 and 448");
        const u = is25519 ? Fp2.div(_1n4 + y, _1n4 - y) : Fp2.div(y - _1n4, y + _1n4);
        return Fp2.toBytes(u);
      },
      toMontgomerySecret(secretKey) {
        const size = lengths.secretKey;
        abytes(secretKey, size);
        const hashed = cHash(secretKey.subarray(0, size));
        return adjustScalarBytes3(hashed).subarray(0, size);
      }
    };
    return Object.freeze({
      keygen: createKeygen(randomSecretKey, getPublicKey),
      getPublicKey,
      sign,
      verify,
      utils,
      Point,
      lengths
    });
  }

  // node_modules/@noble/curves/abstract/montgomery.js
  var _0n5 = BigInt(0);
  var _1n5 = BigInt(1);
  var _2n3 = BigInt(2);
  function validateOpts(curve) {
    validateObject(curve, {
      adjustScalarBytes: "function",
      powPminus2: "function"
    });
    return Object.freeze({ ...curve });
  }
  function montgomery(curveDef) {
    const CURVE = validateOpts(curveDef);
    const { P, type, adjustScalarBytes: adjustScalarBytes3, powPminus2, randomBytes: rand } = CURVE;
    const is25519 = type === "x25519";
    if (!is25519 && type !== "x448")
      throw new Error("invalid type");
    const randomBytes_ = rand || randomBytes;
    const montgomeryBits = is25519 ? 255 : 448;
    const fieldLen = is25519 ? 32 : 56;
    const Gu = is25519 ? BigInt(9) : BigInt(5);
    const a24 = is25519 ? BigInt(121665) : BigInt(39081);
    const minScalar = is25519 ? _2n3 ** BigInt(254) : _2n3 ** BigInt(447);
    const maxAdded = is25519 ? BigInt(8) * _2n3 ** BigInt(251) - _1n5 : BigInt(4) * _2n3 ** BigInt(445) - _1n5;
    const maxScalar = minScalar + maxAdded + _1n5;
    const modP = (n) => mod(n, P);
    const GuBytes = encodeU(Gu);
    function encodeU(u) {
      return numberToBytesLE(modP(u), fieldLen);
    }
    function decodeU(u) {
      const _u = copyBytes(abytes(u, fieldLen, "uCoordinate"));
      if (is25519)
        _u[31] &= 127;
      return modP(bytesToNumberLE(_u));
    }
    function decodeScalar(scalar) {
      return bytesToNumberLE(adjustScalarBytes3(copyBytes(abytes(scalar, fieldLen, "scalar"))));
    }
    function scalarMult(scalar, u) {
      const pu = montgomeryLadder(decodeU(u), decodeScalar(scalar));
      if (pu === _0n5)
        throw new Error("invalid private or public key received");
      return encodeU(pu);
    }
    function scalarMultBase(scalar) {
      return scalarMult(scalar, GuBytes);
    }
    const getPublicKey = scalarMultBase;
    const getSharedSecret = scalarMult;
    function cswap(swap, x_2, x_3) {
      const dummy = modP(swap * (x_2 - x_3));
      x_2 = modP(x_2 - dummy);
      x_3 = modP(x_3 + dummy);
      return { x_2, x_3 };
    }
    function montgomeryLadder(u, scalar) {
      aInRange("u", u, _0n5, P);
      aInRange("scalar", scalar, minScalar, maxScalar);
      const k = scalar;
      const x_1 = u;
      let x_2 = _1n5;
      let z_2 = _0n5;
      let x_3 = u;
      let z_3 = _1n5;
      let swap = _0n5;
      for (let t = BigInt(montgomeryBits - 1); t >= _0n5; t--) {
        const k_t = k >> t & _1n5;
        swap ^= k_t;
        ({ x_2, x_3 } = cswap(swap, x_2, x_3));
        ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
        swap = k_t;
        const A = x_2 + z_2;
        const AA = modP(A * A);
        const B = x_2 - z_2;
        const BB = modP(B * B);
        const E = AA - BB;
        const C = x_3 + z_3;
        const D = x_3 - z_3;
        const DA = modP(D * A);
        const CB = modP(C * B);
        const dacb = DA + CB;
        const da_cb = DA - CB;
        x_3 = modP(dacb * dacb);
        z_3 = modP(x_1 * modP(da_cb * da_cb));
        x_2 = modP(AA * BB);
        z_2 = modP(E * (AA + modP(a24 * E)));
      }
      ({ x_2, x_3 } = cswap(swap, x_2, x_3));
      ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
      const z2 = powPminus2(z_2);
      return modP(x_2 * z2);
    }
    const lengths = {
      secretKey: fieldLen,
      publicKey: fieldLen,
      seed: fieldLen
    };
    const randomSecretKey = (seed = randomBytes_(fieldLen)) => {
      abytes(seed, lengths.seed, "seed");
      return seed;
    };
    const utils = { randomSecretKey };
    return Object.freeze({
      keygen: createKeygen(randomSecretKey, getPublicKey),
      getSharedSecret,
      getPublicKey,
      scalarMult,
      scalarMultBase,
      utils,
      GuBytes: GuBytes.slice(),
      lengths
    });
  }

  // node_modules/@noble/curves/ed25519.js
  var _1n6 = BigInt(1);
  var _2n4 = BigInt(2);
  var _3n2 = /* @__PURE__ */ BigInt(3);
  var _5n2 = BigInt(5);
  var _8n3 = BigInt(8);
  var ed25519_CURVE_p = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
  var ed25519_CURVE = /* @__PURE__ */ (() => ({
    p: ed25519_CURVE_p,
    n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
    h: _8n3,
    a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
    d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
    Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
    Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
  }))();
  function ed25519_pow_2_252_3(x) {
    const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
    const P = ed25519_CURVE_p;
    const x2 = x * x % P;
    const b2 = x2 * x % P;
    const b4 = pow2(b2, _2n4, P) * b2 % P;
    const b5 = pow2(b4, _1n6, P) * x % P;
    const b10 = pow2(b5, _5n2, P) * b5 % P;
    const b20 = pow2(b10, _10n, P) * b10 % P;
    const b40 = pow2(b20, _20n, P) * b20 % P;
    const b80 = pow2(b40, _40n, P) * b40 % P;
    const b160 = pow2(b80, _80n, P) * b80 % P;
    const b240 = pow2(b160, _80n, P) * b80 % P;
    const b250 = pow2(b240, _10n, P) * b10 % P;
    const pow_p_5_8 = pow2(b250, _2n4, P) * x % P;
    return { pow_p_5_8, b2 };
  }
  function adjustScalarBytes(bytes) {
    bytes[0] &= 248;
    bytes[31] &= 127;
    bytes[31] |= 64;
    return bytes;
  }
  var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
  function uvRatio(u, v) {
    const P = ed25519_CURVE_p;
    const v3 = mod(v * v * v, P);
    const v7 = mod(v3 * v3 * v, P);
    const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
    let x = mod(u * v3 * pow, P);
    const vx2 = mod(v * x * x, P);
    const root1 = x;
    const root2 = mod(x * ED25519_SQRT_M1, P);
    const useRoot1 = vx2 === u;
    const useRoot2 = vx2 === mod(-u, P);
    const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P);
    if (useRoot1)
      x = root1;
    if (useRoot2 || noRoot)
      x = root2;
    if (isNegativeLE(x, P))
      x = mod(-x, P);
    return { isValid: useRoot1 || useRoot2, value: x };
  }
  var ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
  function ed(opts) {
    return eddsa(ed25519_Point, sha512, Object.assign({ adjustScalarBytes }, opts));
  }
  var ed25519 = /* @__PURE__ */ ed({});
  var x25519 = /* @__PURE__ */ (() => {
    const P = ed25519_CURVE_p;
    return montgomery({
      P,
      type: "x25519",
      powPminus2: (x) => {
        const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
        return mod(pow2(pow_p_5_8, _3n2, P) * b2, P);
      },
      adjustScalarBytes
    });
  })();

  // src/protocol.ts
  var import_tweetnacl = __toESM(require_nacl_fast(), 1);
  var import_sha512 = __toESM(require_sha512(), 1);
  function readTag(d) {
    const start = d.offset();
    while (d.remaining() > 0) {
      if (d.buf[d.offset()] === 32 || d.buf[d.offset()] === 10) break;
      d.anyByte();
    }
    let s = "";
    for (let i = start; i < d.offset(); i++) s += String.fromCharCode(d.buf[i]);
    return s;
  }
  function readSpace(d) {
    if (d.anyByte() !== 32) throw new Error("expected space");
  }
  function encodeTransmission(corrId, entityId, command, sessionId, auth, implySessId = true) {
    const tToSend = concatBytes(
      encodeBytes(corrId),
      encodeBytes(entityId),
      command
    );
    const tForAuth = sessionId ? concatBytes(encodeBytes(sessionId), tToSend) : tToSend;
    const parts = [];
    if (auth && auth.type === "ed25519") {
      const signature = ed25519.sign(tForAuth, auth.signKey);
      parts.push(new Uint8Array([64]));
      parts.push(signature);
    } else if (auth && auth.type === "cb") {
      const hash = (0, import_sha512.sha512)(tForAuth);
      const authenticator = import_tweetnacl.default.box(hash, corrId, auth.serverPubKeyRaw, auth.queuePrivKeyRaw);
      parts.push(new Uint8Array([80]));
      parts.push(authenticator);
    } else {
      parts.push(new Uint8Array([0]));
    }
    if (sessionId && !implySessId) {
      parts.push(encodeBytes(sessionId));
    }
    parts.push(tToSend);
    return concatBytes(...parts);
  }
  function decodeTransmission(d, hasSessionId) {
    const _auth = decodeBytes(d);
    if (hasSessionId) {
      decodeBytes(d);
    }
    const corrId = decodeBytes(d);
    const entityId = decodeBytes(d);
    const command = d.takeAll();
    return { corrId, entityId, command };
  }
  function decodeLNK(d) {
    const senderId = decodeBytes(d);
    const encFixedData = decodeLarge(d);
    const encUserData = decodeLarge(d);
    return { senderId, encFixedData, encUserData };
  }
  function decodeCMDError(d) {
    const tag = readTag(d);
    switch (tag) {
      case "SYNTAX":
        return "SYNTAX";
      case "PROHIBITED":
        return "PROHIBITED";
      case "NO_AUTH":
        return "NO_AUTH";
      case "HAS_AUTH":
        return "HAS_AUTH";
      case "NO_ENTITY":
        return "NO_ENTITY";
      default:
        return "UNKNOWN";
    }
  }
  function decodeTransportError(d) {
    const tag = readTag(d);
    switch (tag) {
      case "BLOCK":
        return "BLOCK";
      case "VERSION":
        return "VERSION";
      case "LARGE_MSG":
        return "LARGE_MSG";
      case "SESSION":
        return "SESSION";
      case "NO_AUTH":
        return "NO_AUTH";
      case "HANDSHAKE": {
        readSpace(d);
        const hsTag = readTag(d);
        let handshakeError;
        switch (hsTag) {
          case "PARSE":
            handshakeError = "PARSE";
            break;
          case "IDENTITY":
            handshakeError = "IDENTITY";
            break;
          case "BAD_AUTH":
            handshakeError = "BAD_AUTH";
            break;
          default:
            handshakeError = "PARSE";
            break;
        }
        return { type: "HANDSHAKE", handshakeError };
      }
      default:
        return "BLOCK";
    }
  }
  function decodeBrokerError(d) {
    const tag = readTag(d);
    switch (tag) {
      case "RESPONSE": {
        readSpace(d);
        const info = decodeBytes(d);
        let s = "";
        for (const b of info) s += String.fromCharCode(b);
        return { type: "RESPONSE", info: s };
      }
      case "UNEXPECTED": {
        readSpace(d);
        const info = decodeBytes(d);
        let s = "";
        for (const b of info) s += String.fromCharCode(b);
        return { type: "UNEXPECTED", info: s };
      }
      case "NETWORK":
        return { type: "NETWORK" };
      case "TIMEOUT":
        return { type: "TIMEOUT" };
      case "HOST":
        return { type: "HOST" };
      case "TRANSPORT": {
        readSpace(d);
        return { type: "TRANSPORT", transportError: decodeTransportError(d) };
      }
      default:
        return { type: "NETWORK" };
    }
  }
  function decodeProxyError(d) {
    const tag = readTag(d);
    switch (tag) {
      case "PROTOCOL": {
        readSpace(d);
        return { type: "PROTOCOL", error: decodeError(d) };
      }
      case "BASIC_AUTH":
        return { type: "BASIC_AUTH" };
      case "NO_SESSION":
        return { type: "NO_SESSION" };
      case "BROKER": {
        readSpace(d);
        return { type: "BROKER", brokerError: decodeBrokerError(d) };
      }
      default:
        return { type: "NO_SESSION" };
    }
  }
  function decodeError(d) {
    const tag = readTag(d);
    switch (tag) {
      case "BLOCK":
        return { type: "BLOCK" };
      case "SESSION":
        return { type: "SESSION" };
      case "AUTH":
        return { type: "AUTH" };
      case "QUOTA":
        return { type: "QUOTA" };
      case "LARGE_MSG":
        return { type: "LARGE_MSG" };
      case "INTERNAL":
        return { type: "INTERNAL" };
      case "CMD": {
        readSpace(d);
        return { type: "CMD", cmdError: decodeCMDError(d) };
      }
      case "PROXY": {
        readSpace(d);
        return { type: "PROXY", proxyError: decodeProxyError(d) };
      }
      default:
        return { type: "INTERNAL" };
    }
  }
  function decodeResponse(d) {
    const tag = readTag(d);
    switch (tag) {
      case "LNK": {
        readSpace(d);
        return { type: "LNK", response: decodeLNK(d) };
      }
      case "OK":
        return { type: "OK" };
      case "IDS": {
        readSpace(d);
        const recipientId = decodeBytes(d);
        const senderId = decodeBytes(d);
        const serverDhKey = decodeBytes(d);
        let sndSecure = false;
        if (d.remaining() > 0) {
          const flag = d.anyByte();
          sndSecure = flag === 84;
        }
        return { type: "IDS", recipientId, senderId, serverDhKey, sndSecure };
      }
      case "MSG": {
        readSpace(d);
        const msgId = decodeBytes(d);
        const encryptedBody = d.takeAll();
        return { type: "MSG", msgId, encryptedBody };
      }
      case "NID": {
        readSpace(d);
        const notifierId = decodeBytes(d);
        const serverNtfDhKey = decodeBytes(d);
        return { type: "NID", notifierId, serverNtfDhKey };
      }
      case "NMSG": {
        readSpace(d);
        const nmsgNonce = d.take(24);
        const encryptedMeta = d.takeAll();
        return { type: "NMSG", nmsgNonce, encryptedMeta };
      }
      case "INFO": {
        readSpace(d);
        const bytes = d.takeAll();
        let info = "";
        for (const b of bytes) info += String.fromCharCode(b);
        return { type: "INFO", info };
      }
      case "PONG":
        return { type: "PONG" };
      case "END":
        return { type: "END" };
      case "ERR": {
        readSpace(d);
        return { type: "ERR", error: decodeError(d) };
      }
      default:
        throw new Error("unknown SMP response: " + tag);
    }
  }

  // node_modules/@noble/curves/node_modules/@noble/hashes/sha3.js
  var _0n6 = BigInt(0);
  var _1n7 = BigInt(1);
  var _2n5 = BigInt(2);
  var _7n2 = BigInt(7);
  var _256n = BigInt(256);
  var _0x71n = BigInt(113);
  var SHA3_PI = [];
  var SHA3_ROTL = [];
  var _SHA3_IOTA = [];
  for (let round = 0, R = _1n7, x = 1, y = 0; round < 24; round++) {
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
    let t = _0n6;
    for (let j = 0; j < 7; j++) {
      R = (R << _1n7 ^ (R >> _7n2) * _0x71n) % _256n;
      if (R & _2n5)
        t ^= _1n7 << (_1n7 << BigInt(j)) - _1n7;
    }
    _SHA3_IOTA.push(t);
  }
  var IOTAS = split(_SHA3_IOTA, true);
  var SHA3_IOTA_H = IOTAS[0];
  var SHA3_IOTA_L = IOTAS[1];
  var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
  var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
  function keccakP(s, rounds = 24) {
    const B = new Uint32Array(5 * 2);
    for (let round = 24 - rounds; round < 24; round++) {
      for (let x = 0; x < 10; x++)
        B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
      for (let x = 0; x < 10; x += 2) {
        const idx1 = (x + 8) % 10;
        const idx0 = (x + 2) % 10;
        const B0 = B[idx0];
        const B1 = B[idx0 + 1];
        const Th = rotlH(B0, B1, 1) ^ B[idx1];
        const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
        for (let y = 0; y < 50; y += 10) {
          s[x + y] ^= Th;
          s[x + y + 1] ^= Tl;
        }
      }
      let curH = s[2];
      let curL = s[3];
      for (let t = 0; t < 24; t++) {
        const shift = SHA3_ROTL[t];
        const Th = rotlH(curH, curL, shift);
        const Tl = rotlL(curH, curL, shift);
        const PI = SHA3_PI[t];
        curH = s[PI];
        curL = s[PI + 1];
        s[PI] = Th;
        s[PI + 1] = Tl;
      }
      for (let y = 0; y < 50; y += 10) {
        for (let x = 0; x < 10; x++)
          B[x] = s[y + x];
        for (let x = 0; x < 10; x++)
          s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
      }
      s[0] ^= SHA3_IOTA_H[round];
      s[1] ^= SHA3_IOTA_L[round];
    }
    clean(B);
  }
  var Keccak = class _Keccak {
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
      __publicField(this, "state");
      __publicField(this, "pos", 0);
      __publicField(this, "posOut", 0);
      __publicField(this, "finished", false);
      __publicField(this, "state32");
      __publicField(this, "destroyed", false);
      __publicField(this, "blockLen");
      __publicField(this, "suffix");
      __publicField(this, "outputLen");
      __publicField(this, "enableXOF", false);
      __publicField(this, "rounds");
      this.blockLen = blockLen;
      this.suffix = suffix;
      this.outputLen = outputLen;
      this.enableXOF = enableXOF;
      this.rounds = rounds;
      anumber(outputLen, "outputLen");
      if (!(0 < blockLen && blockLen < 200))
        throw new Error("only keccak-f1600 function is supported");
      this.state = new Uint8Array(200);
      this.state32 = u32(this.state);
    }
    clone() {
      return this._cloneInto();
    }
    keccak() {
      swap32IfBE(this.state32);
      keccakP(this.state32, this.rounds);
      swap32IfBE(this.state32);
      this.posOut = 0;
      this.pos = 0;
    }
    update(data) {
      aexists(this);
      abytes(data);
      const { blockLen, state } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        for (let i = 0; i < take; i++)
          state[this.pos++] ^= data[pos++];
        if (this.pos === blockLen)
          this.keccak();
      }
      return this;
    }
    finish() {
      if (this.finished)
        return;
      this.finished = true;
      const { state, suffix, pos, blockLen } = this;
      state[pos] ^= suffix;
      if ((suffix & 128) !== 0 && pos === blockLen - 1)
        this.keccak();
      state[blockLen - 1] ^= 128;
      this.keccak();
    }
    writeInto(out) {
      aexists(this, false);
      abytes(out);
      this.finish();
      const bufferOut = this.state;
      const { blockLen } = this;
      for (let pos = 0, len = out.length; pos < len; ) {
        if (this.posOut >= blockLen)
          this.keccak();
        const take = Math.min(blockLen - this.posOut, len - pos);
        out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
        this.posOut += take;
        pos += take;
      }
      return out;
    }
    xofInto(out) {
      if (!this.enableXOF)
        throw new Error("XOF is not possible for this instance");
      return this.writeInto(out);
    }
    xof(bytes) {
      anumber(bytes);
      return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
      aoutput(out, this);
      if (this.finished)
        throw new Error("digest() was already called");
      this.writeInto(out);
      this.destroy();
      return out;
    }
    digest() {
      return this.digestInto(new Uint8Array(this.outputLen));
    }
    destroy() {
      this.destroyed = true;
      clean(this.state);
    }
    _cloneInto(to) {
      const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
      to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
      to.state32.set(this.state32);
      to.pos = this.pos;
      to.posOut = this.posOut;
      to.finished = this.finished;
      to.rounds = rounds;
      to.suffix = suffix;
      to.outputLen = outputLen;
      to.enableXOF = enableXOF;
      to.destroyed = this.destroyed;
      return to;
    }
  };
  var genShake = (suffix, blockLen, outputLen, info = {}) => createHasher((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === void 0 ? outputLen : opts.dkLen, true), info);
  var shake256 = /* @__PURE__ */ genShake(31, 136, 32, /* @__PURE__ */ oidNist(12));

  // node_modules/@noble/curves/ed448.js
  var ed448_CURVE_p = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  var ed448_CURVE = /* @__PURE__ */ (() => ({
    p: ed448_CURVE_p,
    n: BigInt("0x3fffffffffffffffffffffffffffffffffffffffffffffffffffffff7cca23e9c44edb49aed63690216cc2728dc58f552378c292ab5844f3"),
    h: BigInt(4),
    a: BigInt(1),
    d: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffffffffffffffffffffffffffffffffffffffffffffffff6756"),
    Gx: BigInt("0x4f1970c66bed0ded221d15a622bf36da9e146570470f1767ea6de324a3d3a46412ae1af72ab66511433b80e18b00938e2626a82bc70cc05e"),
    Gy: BigInt("0x693f46716eb6bc248876203756c9c7624bea73736ca3984087789c1e05a0c2d73ad3ff1ce67c39c4fdbd132c4ed7c8ad9808795bf230fa14")
  }))();
  var shake256_114 = /* @__PURE__ */ createHasher(() => shake256.create({ dkLen: 114 }));
  var _1n8 = BigInt(1);
  var _2n6 = BigInt(2);
  var _3n3 = BigInt(3);
  var _11n = BigInt(11);
  var _22n = BigInt(22);
  var _44n = BigInt(44);
  var _88n = BigInt(88);
  var _223n = BigInt(223);
  function ed448_pow_Pminus3div4(x) {
    const P = ed448_CURVE_p;
    const b2 = x * x * x % P;
    const b3 = b2 * b2 * x % P;
    const b6 = pow2(b3, _3n3, P) * b3 % P;
    const b9 = pow2(b6, _3n3, P) * b3 % P;
    const b11 = pow2(b9, _2n6, P) * b2 % P;
    const b22 = pow2(b11, _11n, P) * b11 % P;
    const b44 = pow2(b22, _22n, P) * b22 % P;
    const b88 = pow2(b44, _44n, P) * b44 % P;
    const b176 = pow2(b88, _88n, P) * b88 % P;
    const b220 = pow2(b176, _44n, P) * b44 % P;
    const b222 = pow2(b220, _2n6, P) * b2 % P;
    const b223 = pow2(b222, _1n8, P) * x % P;
    return pow2(b223, _223n, P) * b222 % P;
  }
  function adjustScalarBytes2(bytes) {
    bytes[0] &= 252;
    bytes[55] |= 128;
    bytes[56] = 0;
    return bytes;
  }
  function uvRatio2(u, v) {
    const P = ed448_CURVE_p;
    const u2v = mod(u * u * v, P);
    const u3v = mod(u2v * u, P);
    const u5v3 = mod(u3v * u2v * v, P);
    const root = ed448_pow_Pminus3div4(u5v3);
    const x = mod(u3v * root, P);
    const x2 = mod(x * x, P);
    return { isValid: mod(x2 * v, P) === u, value: x };
  }
  var Fp = /* @__PURE__ */ (() => Field(ed448_CURVE_p, { BITS: 456, isLE: true }))();
  var Fn = /* @__PURE__ */ (() => Field(ed448_CURVE.n, { BITS: 456, isLE: true }))();
  function dom4(data, ctx, phflag) {
    if (ctx.length > 255)
      throw new Error("context must be smaller than 255, got: " + ctx.length);
    return concatBytes2(asciiToBytes("SigEd448"), new Uint8Array([phflag ? 1 : 0, ctx.length]), ctx, data);
  }
  var ed448_Point = /* @__PURE__ */ edwards(ed448_CURVE, { Fp, Fn, uvRatio: uvRatio2 });
  function ed4(opts) {
    return eddsa(ed448_Point, shake256_114, Object.assign({ adjustScalarBytes: adjustScalarBytes2, domain: dom4 }, opts));
  }
  var ed448 = /* @__PURE__ */ ed4({});
  var x448 = /* @__PURE__ */ (() => {
    const P = ed448_CURVE_p;
    return montgomery({
      P,
      type: "x448",
      powPminus2: (x) => {
        const Pminus3div4 = ed448_pow_Pminus3div4(x);
        const Pminus3 = pow2(Pminus3div4, _2n6, P);
        return mod(Pminus3 * x, P);
      },
      adjustScalarBytes: adjustScalarBytes2
    });
  })();

  // src/crypto-utils.ts
  var ED25519_SPKI_PREFIX = new Uint8Array([
    48,
    42,
    48,
    5,
    6,
    3,
    43,
    101,
    112,
    3,
    33,
    0
  ]);
  var X25519_SPKI_PREFIX = new Uint8Array([
    48,
    42,
    48,
    5,
    6,
    3,
    43,
    101,
    110,
    3,
    33,
    0
  ]);
  var X448_SPKI_PREFIX = new Uint8Array([
    48,
    66,
    48,
    5,
    6,
    3,
    43,
    101,
    111,
    3,
    57,
    0
  ]);
  function generateEd25519KeyPair() {
    const kp = ed25519.keygen();
    return { publicKey: kp.publicKey, privateKey: kp.secretKey };
  }
  function generateX25519KeyPair() {
    const kp = x25519.keygen();
    return { publicKey: kp.publicKey, privateKey: kp.secretKey };
  }
  function generateX448KeyPair() {
    const kp = x448.keygen();
    return { publicKey: kp.publicKey, privateKey: kp.secretKey };
  }
  function x448DH(privateKey, publicKey) {
    return x448.getSharedSecret(privateKey, publicKey);
  }
  function encodeEd25519PublicKey(rawPublicKey) {
    const result = new Uint8Array(44);
    result.set(ED25519_SPKI_PREFIX, 0);
    result.set(rawPublicKey, 12);
    return result;
  }
  function encodeX25519PublicKey(rawPublicKey) {
    const result = new Uint8Array(44);
    result.set(X25519_SPKI_PREFIX, 0);
    result.set(rawPublicKey, 12);
    return result;
  }
  function encodeX448PublicKey(rawPublicKey) {
    const result = new Uint8Array(68);
    result.set(X448_SPKI_PREFIX, 0);
    result.set(rawPublicKey, 12);
    return result;
  }
  function decodeX448PublicKey(spki) {
    if (spki.length !== 68) throw new Error("decodeX448PublicKey: expected 68 bytes, got " + spki.length);
    for (let i = 0; i < X448_SPKI_PREFIX.length; i++) {
      if (spki[i] !== X448_SPKI_PREFIX[i]) throw new Error("decodeX448PublicKey: invalid SPKI prefix");
    }
    return spki.subarray(12);
  }
  function x25519DH(privateKey, publicKey) {
    return x25519.getSharedSecret(privateKey, publicKey);
  }

  // src/types.ts
  var SMPTransportError = class extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
      this.name = "SMPTransportError";
    }
  };

  // src/transport.ts
  var SMP_BLOCK_SIZE = 16384;
  function toHexShort(bytes) {
    let s = "";
    for (const b of bytes) s += (b < 16 ? "0" : "") + b.toString(16) + " ";
    return s.trim();
  }
  var DEFAULT_CONFIG = {
    connectTimeoutMs: 15e3
  };
  var SMPWebSocketTransport = class {
    constructor(config) {
      __publicField(this, "ws", null);
      __publicField(this, "currentState", "disconnected");
      __publicField(this, "messageHandler", null);
      __publicField(this, "closeHandler", null);
      __publicField(this, "config");
      this.config = { ...DEFAULT_CONFIG, ...config };
    }
    get state() {
      return this.currentState;
    }
    async connect(server) {
      if (this.currentState !== "disconnected") {
        throw new SMPTransportError("NETWORK", "Transport is not disconnected");
      }
      this.currentState = "connecting";
      const url = "wss://" + server.host + ":" + server.port;
      return new Promise((resolve, reject) => {
        let timeoutId = null;
        let settled = false;
        const cleanup = () => {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };
        const settle = (fn) => {
          if (settled) return;
          settled = true;
          cleanup();
          fn();
        };
        try {
          console.log("[WS-DEBUG] new WebSocket(" + url + ")");
          const ws = new WebSocket(url);
          ws.binaryType = "arraybuffer";
          this.ws = ws;
          timeoutId = setTimeout(() => {
            settle(() => {
              ws.close();
              this.ws = null;
              this.currentState = "disconnected";
              reject(new SMPTransportError("TIMEOUT", "Connection timed out after " + this.config.connectTimeoutMs + "ms"));
            });
          }, this.config.connectTimeoutMs);
          ws.addEventListener("open", () => {
            settle(() => {
              this.currentState = "connected";
              resolve();
            });
          });
          ws.addEventListener("error", () => {
            settle(() => {
              this.ws = null;
              this.currentState = "disconnected";
              reject(new SMPTransportError("NETWORK", "WebSocket connection failed to " + url));
            });
          });
          ws.addEventListener("close", () => {
            if (!settled) {
              settle(() => {
                this.ws = null;
                this.currentState = "disconnected";
                reject(new SMPTransportError("CLOSED", "Connection closed during connect"));
              });
            } else {
              this.ws = null;
              this.currentState = "disconnected";
              if (this.closeHandler !== null) {
                this.closeHandler();
              }
            }
          });
          ws.addEventListener("message", (event) => {
            const data = event.data;
            console.log("[SMP] transport.onmessage: received " + data.byteLength + "B");
            if (data.byteLength !== SMP_BLOCK_SIZE) {
              console.log("[SMP] transport.onmessage: BLOCK_SIZE ERROR, got " + data.byteLength + " expected " + SMP_BLOCK_SIZE);
              const error = new SMPTransportError(
                "BLOCK_SIZE",
                "Received block of " + data.byteLength + " bytes, expected " + SMP_BLOCK_SIZE
              );
              this.close();
              throw error;
            }
            if (this.messageHandler !== null) {
              this.messageHandler(new Uint8Array(data));
            } else {
              console.log("[SMP] transport.onmessage: NO handler registered, message dropped!");
            }
          });
        } catch (e) {
          settle(() => {
            this.ws = null;
            this.currentState = "disconnected";
            if (e instanceof SMPTransportError) {
              reject(e);
            } else {
              reject(new SMPTransportError("NETWORK", "Failed to create WebSocket: " + String(e)));
            }
          });
        }
      });
    }
    async send(block) {
      if (this.currentState !== "connected") {
        console.log("[SMP] transport.send REJECTED: state=" + this.currentState);
        throw new SMPTransportError("CLOSED", "Cannot send: transport is not connected");
      }
      if (block.length !== SMP_BLOCK_SIZE) {
        console.log("[SMP] transport.send REJECTED: block size=" + block.length);
        throw new SMPTransportError(
          "BLOCK_SIZE",
          "Block must be exactly " + SMP_BLOCK_SIZE + " bytes, got " + block.length
        );
      }
      console.log("[SMP] transport.send: " + block.length + "B, first 4 bytes:", toHexShort(block.subarray(0, 4)));
      this.ws.send(block);
    }
    onMessage(handler) {
      this.messageHandler = handler;
    }
    // Register handler for connection close/disconnect events.
    // Fires when WebSocket closes after connection was established
    // (not during initial connect - those reject the connect Promise).
    onClose(handler) {
      this.closeHandler = handler;
    }
    close() {
      if (this.ws === null) {
        this.currentState = "disconnected";
        return;
      }
      if (this.currentState === "connected" || this.currentState === "connecting") {
        this.currentState = "closing";
        this.ws.close();
      }
    }
  };

  // src/handshake.ts
  var import_sha256 = __toESM(require_sha256(), 1);
  var minSMPClientVersion = 6;
  var maxSMPClientVersion = 9;
  var smpClientVersionRange = {
    minVersion: minSMPClientVersion,
    maxVersion: maxSMPClientVersion
  };
  function decodeVersionRange(d) {
    const minVersion = decodeWord16(d);
    const maxVersion = decodeWord16(d);
    if (minVersion > maxVersion) throw new Error("invalid version range: min > max");
    return { minVersion, maxVersion };
  }
  function compatibleVRange(a, b) {
    const min = Math.max(a.minVersion, b.minVersion);
    const max = Math.min(a.maxVersion, b.maxVersion);
    if (min > max) return null;
    return { minVersion: min, maxVersion: max };
  }
  function blockPad(msg, blockSize = SMP_BLOCK_SIZE) {
    const len = msg.length;
    const padLen = blockSize - len - 2;
    if (padLen < 0) throw new Error("blockPad: message too large for block");
    const result = new Uint8Array(blockSize);
    result[0] = len >>> 8 & 255;
    result[1] = len & 255;
    result.set(msg, 2);
    result.fill(35, 2 + len);
    return result;
  }
  function blockUnpad(block) {
    if (block.length < 2) throw new Error("blockUnpad: too short");
    const len = block[0] << 8 | block[1];
    if (2 + len > block.length) throw new Error("blockUnpad: invalid length");
    return block.subarray(2, 2 + len);
  }
  function extractX25519AuthKey(signedKeyDer) {
    if (signedKeyDer.length < 37) return null;
    for (let i = 0; i < signedKeyDer.length - 37; i++) {
      if (signedKeyDer[i] === 6 && signedKeyDer[i + 1] === 3 && signedKeyDer[i + 2] === 43 && signedKeyDer[i + 3] === 101 && signedKeyDer[i + 4] === 110) {
        const keyStart = i + 5 + 2 + 1;
        if (keyStart + 32 <= signedKeyDer.length) {
          return signedKeyDer.slice(keyStart, keyStart + 32);
        }
      }
    }
    return null;
  }
  function decodeSMPServerHandshake(block) {
    const raw = blockUnpad(block);
    if (raw.length < 20) {
      const text = String.fromCharCode(...raw);
      if (/^[A-Z_]+$/.test(text)) {
        throw new SMPTransportError("HANDSHAKE", "Server handshake error: " + text);
      }
    }
    const d = new Decoder(raw);
    const smpVersionRange = decodeVersionRange(d);
    const sessionId = decodeBytes(d);
    let certChainDer = [];
    let signedKeyDer = new Uint8Array(0);
    let serverAuthPubKeyRaw = null;
    if (d.remaining() > 0) {
      try {
        certChainDer = decodeNonEmpty(decodeLarge, d);
        signedKeyDer = decodeLarge(d);
        if (signedKeyDer.length > 0) {
          serverAuthPubKeyRaw = extractX25519AuthKey(signedKeyDer);
          if (serverAuthPubKeyRaw) {
            console.log("[SMP] Server auth X25519 key extracted: " + serverAuthPubKeyRaw.length + " bytes");
          }
        }
      } catch (_e) {
      }
    }
    return { smpVersionRange, sessionId, certChainDer, signedKeyDer, serverAuthPubKeyRaw };
  }
  function encodeSMPClientHandshake(ch) {
    const parts = [encodeWord16(ch.smpVersion), encodeBytes(ch.keyHash)];
    if (ch.smpVersion >= 7 && ch.sessionAuthPubKeySPKI) {
      parts.push(encodeBytes(ch.sessionAuthPubKeySPKI));
    }
    const body = concatBytes(...parts);
    return blockPad(body);
  }
  function chainIdCaCerts(certChainDer) {
    switch (certChainDer.length) {
      case 2:
        return { leafCert: certChainDer[0], idCert: certChainDer[1] };
      case 3:
        return { leafCert: certChainDer[0], idCert: certChainDer[1] };
      case 4:
        return { leafCert: certChainDer[0], idCert: certChainDer[1] };
      default:
        return null;
    }
  }
  function caFingerprint(certChainDer) {
    const cc = chainIdCaCerts(certChainDer);
    if (cc === null) {
      throw new SMPTransportError("IDENTITY", "Invalid certificate chain (need 2-4 certs)");
    }
    return (0, import_sha256.sha256)(cc.idCert);
  }
  function derLength(d) {
    const first = d.anyByte();
    if (first < 128) return first;
    const numBytes = first & 127;
    if (numBytes === 0 || numBytes > 4) throw new Error("DER: unsupported length encoding");
    let len = 0;
    for (let i = 0; i < numBytes; i++) {
      len = len << 8 | d.anyByte();
    }
    return len;
  }
  function derElement(d) {
    const start = d.offset();
    d.anyByte();
    const len = derLength(d);
    d.take(len);
    return d.buf.subarray(start, d.offset());
  }
  function derSkip(d) {
    d.anyByte();
    d.take(derLength(d));
  }
  function extractSignedKey(signedDer) {
    const outer = new Decoder(signedDer);
    const outerTag = outer.anyByte();
    if (outerTag !== 48) {
      throw new Error("SignedExact: expected SEQUENCE tag 0x30, got 0x" + outerTag.toString(16));
    }
    derLength(outer);
    const objectDer = derElement(outer);
    const algorithm = derElement(outer);
    const sigTag = outer.anyByte();
    if (sigTag !== 3) {
      throw new Error("SignedExact: expected BIT STRING tag 0x03, got 0x" + sigTag.toString(16));
    }
    const sigLen = derLength(outer);
    const unusedBits = outer.anyByte();
    if (unusedBits !== 0) throw new Error("SignedExact: expected 0 unused bits in signature");
    const signature = outer.take(sigLen - 1);
    return { objectDer, algorithm, signature };
  }
  function extractCertPublicKeyInfo(certDer) {
    const d = new Decoder(certDer);
    if (d.anyByte() !== 48) throw new Error("X.509: expected Certificate SEQUENCE");
    derLength(d);
    if (d.anyByte() !== 48) throw new Error("X.509: expected TBSCertificate SEQUENCE");
    derLength(d);
    if (d.buf[d.offset()] === 160) derSkip(d);
    derSkip(d);
    derSkip(d);
    derSkip(d);
    derSkip(d);
    derSkip(d);
    return derElement(d);
  }
  function detectKeyAlgorithm(spki) {
    if (spki.length === 44 && spki[8] === 112) return "ed25519";
    if (spki.length === 69 && spki[8] === 113) return "ed448";
    throw new Error("Unsupported certificate key algorithm (SPKI length=" + spki.length + ")");
  }
  function extractRawPubKey(spki) {
    const alg = detectKeyAlgorithm(spki);
    if (alg === "ed25519") return spki.subarray(12, 44);
    return spki.subarray(12, 69);
  }
  function verifySignature(spki, signature, message) {
    const alg = detectKeyAlgorithm(spki);
    const key = extractRawPubKey(spki);
    if (alg === "ed25519") {
      return ed25519.verify(signature, message, key);
    }
    return ed448.verify(signature, message, key);
  }
  function constantTimeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }
  function verifyServerIdentity(serverHello, expectedKeyHash) {
    const fingerprint = caFingerprint(serverHello.certChainDer);
    if (!constantTimeEqual(fingerprint, expectedKeyHash)) {
      throw new SMPTransportError("IDENTITY", "Server certificate fingerprint mismatch");
    }
    const signedKey = extractSignedKey(serverHello.signedKeyDer);
    const certs = chainIdCaCerts(serverHello.certChainDer);
    if (certs === null) {
      throw new SMPTransportError("IDENTITY", "Invalid certificate chain");
    }
    const leafSpki = extractCertPublicKeyInfo(certs.leafCert);
    const valid = verifySignature(leafSpki, signedKey.signature, signedKey.objectDer);
    if (!valid) {
      throw new SMPTransportError("IDENTITY", "Server DH key signature verification failed");
    }
  }
  function buildCommandBlock(transmission) {
    const batch = concatBytes(new Uint8Array([1]), encodeLarge(transmission));
    return blockPad(batch);
  }
  function parseResponseBlock(block) {
    const raw = blockUnpad(block);
    const d = new Decoder(raw);
    const count = d.anyByte();
    if (count < 1) throw new Error("Empty batch (count=0)");
    return decodeLarge(d);
  }
  function parseAllTransmissions(block) {
    const raw = blockUnpad(block);
    const d = new Decoder(raw);
    const count = d.anyByte();
    if (count < 1) throw new Error("Empty batch (count=0)");
    const transmissions = [];
    for (let i = 0; i < count; i++) {
      if (d.remaining() < 2) break;
      transmissions.push(decodeLarge(d));
    }
    return transmissions;
  }

  // src/commands.ts
  function ascii(s) {
    const buf = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
    return buf;
  }
  function encodeNEW(params) {
    return concatBytes(
      ascii("NEW "),
      encodeBytes(params.recipientAuthKey),
      // [0x2C][44B X25519 SPKI for v9]
      encodeBytes(params.recipientDhKey),
      // [0x2C][44B X25519 SPKI]
      ascii("0" + params.subscribeMode + "T")
      // "0ST" = Nothing + Subscribe + sndSecure
    );
  }
  function encodeSUB() {
    return ascii("SUB");
  }
  function encodeKEY(senderAuthKey) {
    return concatBytes(ascii("KEY "), encodeBytes(senderAuthKey));
  }
  function encodeSKEY(senderAuthKey) {
    return concatBytes(ascii("SKEY "), encodeBytes(senderAuthKey));
  }
  function encodeSEND(params) {
    const flag = params.notification ? 84 : 70;
    console.log("[SMP] encodeSEND: flag=" + String.fromCharCode(flag) + ", encMessage=" + params.encMessage.length + "B");
    const result = concatBytes(
      ascii("SEND "),
      new Uint8Array([flag, 32]),
      // flag + space
      params.encMessage
    );
    console.log("[SMP] encodeSEND: total command=" + result.length + "B (expected: " + (7 + params.encMessage.length) + "B)");
    return result;
  }
  function encodeACK(msgId) {
    return concatBytes(ascii("ACK "), encodeBytes(msgId));
  }
  function encodeDEL() {
    return ascii("DEL");
  }
  function encodeOFF() {
    return ascii("OFF");
  }
  function encodeGET() {
    return ascii("GET");
  }
  function encodeNKEY(params) {
    return concatBytes(
      ascii("NKEY "),
      encodeBytes(params.notifierKey),
      encodeBytes(params.recipientNtfDhKey)
    );
  }
  function encodeNDEL() {
    return ascii("NDEL");
  }
  function encodeNSUB() {
    return ascii("NSUB");
  }
  function encodeQUE() {
    return ascii("QUE");
  }

  // src/client.ts
  var DEFAULT_CLIENT_CONFIG = {
    connectTimeoutMs: 15e3,
    keepaliveIntervalMs: 3e4,
    handshakeTimeoutMs: 15e3,
    commandTimeoutMs: 3e4,
    onDebug: void 0
  };
  var SMPCommandError = class extends Error {
    constructor(smpError) {
      super("SMP error: " + formatSMPError(smpError));
      __publicField(this, "smpError");
      this.name = "SMPCommandError";
      this.smpError = smpError;
    }
  };
  function formatSMPError(err) {
    switch (err.type) {
      case "BLOCK":
        return "BLOCK";
      case "SESSION":
        return "SESSION";
      case "AUTH":
        return "AUTH";
      case "QUOTA":
        return "QUOTA";
      case "LARGE_MSG":
        return "LARGE_MSG";
      case "INTERNAL":
        return "INTERNAL";
      case "CMD":
        return "CMD " + err.cmdError;
      case "PROXY":
        return "PROXY " + formatProxyError(err.proxyError);
    }
  }
  function formatProxyError(err) {
    switch (err.type) {
      case "BASIC_AUTH":
        return "BASIC_AUTH";
      case "NO_SESSION":
        return "NO_SESSION";
      case "PROTOCOL":
        return "PROTOCOL " + formatSMPError(err.error);
      case "BROKER":
        return "BROKER " + formatBrokerError(err.brokerError);
    }
  }
  function formatBrokerError(err) {
    switch (err.type) {
      case "RESPONSE":
        return "RESPONSE " + err.info;
      case "UNEXPECTED":
        return "UNEXPECTED " + err.info;
      case "NETWORK":
        return "NETWORK";
      case "TIMEOUT":
        return "TIMEOUT";
      case "HOST":
        return "HOST";
      case "TRANSPORT": {
        const te = err.transportError;
        if (typeof te === "string") return "TRANSPORT " + te;
        return "TRANSPORT HANDSHAKE " + te.handshakeError;
      }
    }
  }
  function encodePING() {
    return new Uint8Array([80, 73, 78, 71]);
  }
  function generateCorrId() {
    const id = new Uint8Array(24);
    crypto.getRandomValues(id);
    return id;
  }
  function toHex(bytes) {
    let s = "";
    for (const b of bytes) s += (b < 16 ? "0" : "") + b.toString(16);
    return s;
  }
  var SMPClientImpl = class {
    constructor(sessionId, smpVersion, transport, keepaliveIntervalMs, commandTimeoutMs = 3e4, debugFn, serverAuthPubKeyRaw) {
      __publicField(this, "sessionId");
      __publicField(this, "smpVersion");
      __publicField(this, "transport");
      /** Server's X25519 public key for v7+ command authorization (null if v6) */
      __publicField(this, "serverAuthPubKeyRaw");
      __publicField(this, "currentState", "ready");
      __publicField(this, "responseHandler", null);
      __publicField(this, "pushHandler", null);
      __publicField(this, "messageHandler", null);
      __publicField(this, "subscriptionEndHandler", null);
      __publicField(this, "keepaliveTimer", null);
      __publicField(this, "keepaliveIntervalMs");
      __publicField(this, "commandTimeoutMs");
      __publicField(this, "pendingCommands", /* @__PURE__ */ new Map());
      __publicField(this, "debugFn", null);
      this.sessionId = sessionId;
      this.smpVersion = smpVersion;
      this.transport = transport;
      this.serverAuthPubKeyRaw = serverAuthPubKeyRaw ?? null;
      this.keepaliveIntervalMs = keepaliveIntervalMs;
      this.commandTimeoutMs = commandTimeoutMs;
      this.debugFn = debugFn ?? null;
      this.setupDispatch();
    }
    get state() {
      return this.currentState;
    }
    /**
     * Diagnostic: send a raw PING with explicit sessionId to test wire format.
     * Logs the exact bytes sent and received for protocol debugging.
     * Call this after connectSMP to verify the session is valid.
     */
    async diagnosticPing() {
      console.log("[SMP] diagnosticPing: sessionId=" + toHex(this.sessionId) + " (" + this.sessionId.length + "B)");
      try {
        const response = await this.sendTypedCommand(new Uint8Array(0), encodePING());
        console.log("[SMP] diagnosticPing: response type=" + response.type);
        return response.type;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log("[SMP] diagnosticPing: FAILED: " + msg);
        return "ERROR: " + msg;
      }
    }
    setupDispatch() {
      let blockCount = 0;
      this.transport.onMessage((block) => {
        blockCount++;
        console.log("[SMP] dispatch: incoming block #" + blockCount + ", " + block.length + "B, first 32:", toHex(block.subarray(0, 32)));
        try {
          const transmissions = parseAllTransmissions(block);
          console.log("[SMP] dispatch: block #" + blockCount + " parsed, txCount=" + transmissions.length);
          for (let i = 0; i < transmissions.length; i++) {
            console.log("[SMP] dispatch: tx[" + i + "] " + transmissions[i].length + "B, first 32:", toHex(transmissions[i].subarray(0, 32)));
            this.dispatchSingleTransmission(transmissions[i]);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log("[SMP] dispatch: PARSE ERROR on block #" + blockCount + ": " + msg);
          console.log("[SMP] dispatch: block first 64:", toHex(block.subarray(0, 64)));
        }
      });
    }
    dispatchSingleTransmission(transmissionBytes) {
      try {
        const hasSessionId = this.smpVersion < 7;
        const td = new Decoder(transmissionBytes);
        const { corrId, entityId, command } = decodeTransmission(td, hasSessionId);
        console.log("[SMP] dispatch: corrId=" + toHex(corrId) + " (" + corrId.length + "B), entityId=" + toHex(entityId) + " (" + entityId.length + "B), cmd " + command.length + "B first 8:", toHex(command.subarray(0, 8)));
        const pendingKeys = Array.from(this.pendingCommands.keys());
        console.log("[SMP] dispatch: pending corrIds: [" + pendingKeys.join(", ").substring(0, 200) + "]");
        if (corrId.length > 0) {
          const key = toHex(corrId);
          const pending = this.pendingCommands.get(key);
          if (pending) {
            console.log("[SMP] dispatch: MATCHED corrId " + key.substring(0, 16) + "...");
            this.pendingCommands.delete(key);
            clearTimeout(pending.timer);
            try {
              const response = decodeResponse(new Decoder(command));
              console.log("[SMP] dispatch: response type=" + response.type);
              pending.resolve(response);
            } catch (parseErr) {
              const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
              console.log("[SMP] dispatch: response PARSE ERROR: " + msg);
              pending.reject(parseErr instanceof Error ? parseErr : new Error(String(parseErr)));
            }
          } else {
            if (command.length >= 4 && command[0] === 80 && command[1] === 79 && command[2] === 78 && command[3] === 71) {
              console.log("[SMP] PONG received (keepalive)");
            } else {
              console.log("[SMP] dispatch: NO MATCH for corrId " + key.substring(0, 16) + "... (unmatched response)");
              if (this.responseHandler !== null) {
                this.responseHandler(corrId, entityId, command);
              }
            }
          }
        } else {
          console.log("[SMP] dispatch: empty corrId -> server push");
          this.dispatchServerPush(entityId, command);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log("[SMP] dispatch: TRANSMISSION DECODE ERROR: " + msg);
        console.log("[SMP] dispatch: raw tx first 32:", toHex(transmissionBytes.subarray(0, 32)));
      }
    }
    dispatchServerPush(entityId, command) {
      try {
        const response = decodeResponse(new Decoder(command));
        if (response.type === "MSG" && this.messageHandler !== null) {
          this.messageHandler(entityId, response.msgId, response.encryptedBody);
        }
        if (response.type === "END" && this.subscriptionEndHandler !== null) {
          this.subscriptionEndHandler(entityId);
        }
      } catch (_e) {
      }
      if (this.pushHandler !== null) {
        this.pushHandler(entityId, command);
      }
    }
    // Send a typed command and wait for the corrId-matched response.
    // queuePrivKeyRaw: X25519 private key for v7+ CbAuthenticator, or Ed25519 key for v6.
    sendTypedCommand(entityId, command, queuePrivKeyRaw) {
      if (this.currentState !== "ready") {
        if (this.debugFn) {
          this.debugFn("sendTypedCommand rejected: state=" + this.currentState, command.subarray(0, 16));
        }
        return Promise.reject(new SMPTransportError("CLOSED", "Client is not ready"));
      }
      const corrId = generateCorrId();
      let auth;
      if (queuePrivKeyRaw && this.smpVersion >= 7 && this.serverAuthPubKeyRaw) {
        auth = { type: "cb", serverPubKeyRaw: this.serverAuthPubKeyRaw, queuePrivKeyRaw };
      } else if (queuePrivKeyRaw && this.smpVersion < 7) {
        auth = { type: "ed25519", signKey: queuePrivKeyRaw };
      }
      const implySessId = this.smpVersion >= 7;
      const transmission = encodeTransmission(corrId, entityId, command, this.sessionId, auth, implySessId);
      const block = buildCommandBlock(transmission);
      const key = toHex(corrId);
      console.log("[SMP] sendTypedCommand: corrId=" + key.substring(0, 16) + "..., entityId=" + toHex(entityId) + ", cmd first 4:", toHex(command.subarray(0, 4)));
      console.log("[SMP] sendTypedCommand: sessId=" + toHex(this.sessionId.subarray(0, 8)) + "... (" + this.sessionId.length + "B), implySessId=" + implySessId + ", transmission " + transmission.length + "B");
      console.log("[SMP] sendTypedCommand: transmission first 48:", toHex(transmission.subarray(0, 48)));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pendingCommands.delete(key);
          if (this.debugFn) {
            this.debugFn("Command TIMEOUT after " + this.commandTimeoutMs + "ms", command.subarray(0, 16));
          }
          reject(new SMPTransportError("TIMEOUT", "Command response timeout after " + this.commandTimeoutMs + "ms"));
        }, this.commandTimeoutMs);
        this.pendingCommands.set(key, { resolve, reject, timer });
        this.transport.send(block).catch((err) => {
          this.pendingCommands.delete(key);
          clearTimeout(timer);
          if (this.debugFn) {
            this.debugFn("Command send FAILED: " + err.message, command.subarray(0, 16));
          }
          reject(err);
        });
      });
    }
    // Helper: send command expecting OK, throw on ERR
    async expectOK(entityId, command) {
      const response = await this.sendTypedCommand(entityId, command);
      if (response.type === "OK") return;
      if (response.type === "ERR") throw new SMPCommandError(response.error);
      throw new Error("Unexpected response: " + response.type);
    }
    async sendCommand(block) {
      if (this.currentState !== "ready") {
        throw new SMPTransportError("CLOSED", "Client is not ready");
      }
      await this.transport.send(block);
    }
    onResponse(handler) {
      this.responseHandler = handler;
    }
    onServerPush(handler) {
      this.pushHandler = handler;
    }
    startKeepalive() {
      if (this.keepaliveTimer !== null) return;
      this.keepaliveTimer = setInterval(() => {
        if (this.currentState !== "ready") return;
        const corrId = generateCorrId();
        const implySessId = this.smpVersion >= 7;
        const transmission = encodeTransmission(corrId, new Uint8Array(0), encodePING(), this.sessionId, void 0, implySessId);
        const block = buildCommandBlock(transmission);
        this.transport.send(block).catch(() => {
        });
      }, this.keepaliveIntervalMs);
    }
    close() {
      this.currentState = "closed";
      if (this.keepaliveTimer !== null) {
        clearInterval(this.keepaliveTimer);
        this.keepaliveTimer = null;
      }
      for (const [key, pending] of this.pendingCommands.entries()) {
        clearTimeout(pending.timer);
        pending.reject(new SMPTransportError("CLOSED", "Client closed"));
        this.pendingCommands.delete(key);
      }
      this.transport.close();
    }
    // -- Typed command methods
    async createQueue(params) {
      console.log("[SMP] createQueue: calling sendTypedCommand with NEW, smpVersion=" + this.smpVersion + ", state=" + this.currentState + ", signed=" + (params.recipientAuthPrivateKey ? "YES" : "no"));
      const newParams = { ...params, smpVersion: this.smpVersion };
      const cmd = encodeNEW(newParams);
      console.log("[SMP] createQueue: NEW cmd " + cmd.length + "B, hex:", toHex(cmd.subarray(0, 48)));
      const response = await this.sendTypedCommand(new Uint8Array(0), cmd, params.recipientAuthPrivateKey);
      if (response.type === "IDS") {
        return {
          recipientId: response.recipientId,
          senderId: response.senderId,
          serverDhKey: response.serverDhKey,
          sndSecure: response.sndSecure
        };
      }
      if (response.type === "ERR") throw new SMPCommandError(response.error);
      throw new Error("Unexpected response to NEW: " + response.type);
    }
    async subscribe(recipientId) {
      await this.expectOK(recipientId, encodeSUB());
    }
    async secureQueue(recipientId, senderAuthKey) {
      await this.expectOK(recipientId, encodeKEY(senderAuthKey));
    }
    async secureQueueSender(senderId, senderAuthKey) {
      await this.expectOK(senderId, encodeSKEY(senderAuthKey));
    }
    async sendMessage(senderId, params) {
      await this.expectOK(senderId, encodeSEND(params));
    }
    async sendMessageSigned(senderId, params, senderPrivKey) {
      const response = await this.sendTypedCommand(senderId, encodeSEND(params), senderPrivKey);
      if (response.type === "OK") return;
      if (response.type === "ERR") throw new SMPCommandError(response.error);
      throw new Error("Unexpected response to SEND: " + response.type);
    }
    async acknowledge(recipientId, msgId, authPrivKey) {
      if (authPrivKey) {
        const response = await this.sendTypedCommand(recipientId, encodeACK(msgId), authPrivKey);
        if (response.type === "OK") return;
        if (response.type === "ERR") throw new SMPCommandError(response.error);
        throw new Error("Unexpected response to ACK: " + response.type);
      }
      await this.expectOK(recipientId, encodeACK(msgId));
    }
    async deleteQueue(recipientId) {
      await this.expectOK(recipientId, encodeDEL());
    }
    async suspendQueue(recipientId) {
      await this.expectOK(recipientId, encodeOFF());
    }
    async getMessage(recipientId) {
      const response = await this.sendTypedCommand(recipientId, encodeGET());
      if (response.type === "ERR") throw new SMPCommandError(response.error);
      return response;
    }
    async enableNotifications(recipientId, params) {
      const response = await this.sendTypedCommand(recipientId, encodeNKEY(params));
      if (response.type === "NID") {
        return {
          notifierId: response.notifierId,
          serverNtfDhKey: response.serverNtfDhKey
        };
      }
      if (response.type === "ERR") throw new SMPCommandError(response.error);
      throw new Error("Unexpected response to NKEY: " + response.type);
    }
    async disableNotifications(recipientId) {
      await this.expectOK(recipientId, encodeNDEL());
    }
    async getQueueInfo(recipientId) {
      const response = await this.sendTypedCommand(recipientId, encodeQUE());
      if (response.type === "INFO") return response.info;
      if (response.type === "ERR") throw new SMPCommandError(response.error);
      throw new Error("Unexpected response to QUE: " + response.type);
    }
    onMessage(handler) {
      this.messageHandler = handler;
    }
    onSubscriptionEnd(handler) {
      this.subscriptionEndHandler = handler;
    }
  };
  async function connectSMP(server, config) {
    const cfg = { ...DEFAULT_CLIENT_CONFIG, ...config };
    const debug = cfg.onDebug ?? null;
    console.log("[SMP] connectSMP: connecting to wss://" + server.host + ":" + server.port);
    const transport = new SMPWebSocketTransport({ connectTimeoutMs: cfg.connectTimeoutMs });
    await transport.connect(server);
    console.log("[SMP] connectSMP: WebSocket OPEN, waiting for ServerHello");
    try {
      const serverHelloBlock = await waitForBlock(transport, cfg.handshakeTimeoutMs);
      console.log("[SMP] connectSMP: ServerHello received, " + serverHelloBlock.length + "B");
      if (debug) debug("ServerHello raw (first 64 bytes)", serverHelloBlock.subarray(0, 64));
      const serverHello = decodeSMPServerHandshake(serverHelloBlock);
      console.log("[SMP] connectSMP: ServerHello decoded, version=" + serverHello.smpVersionRange.minVersion + "-" + serverHello.smpVersionRange.maxVersion + ", sessionId=" + serverHello.sessionId.length + "B, certs=" + serverHello.certChainDer.length);
      if (debug) {
        debug("ServerHello sessionId", serverHello.sessionId);
        debug("ServerHello vRange", new Uint8Array([
          serverHello.smpVersionRange.minVersion >> 8 & 255,
          serverHello.smpVersionRange.minVersion & 255,
          serverHello.smpVersionRange.maxVersion >> 8 & 255,
          serverHello.smpVersionRange.maxVersion & 255
        ]));
      }
      if (serverHello.certChainDer.length > 0) {
        verifyServerIdentity(serverHello, server.keyHash);
      }
      const vr = compatibleVRange(serverHello.smpVersionRange, smpClientVersionRange);
      if (vr === null) {
        throw new SMPTransportError(
          "VERSION",
          "Incompatible SMP version: server " + serverHello.smpVersionRange.minVersion + "-" + serverHello.smpVersionRange.maxVersion + ", client " + smpClientVersionRange.minVersion + "-" + smpClientVersionRange.maxVersion
        );
      }
      const smpVersion = vr.maxVersion;
      console.log("[SMP] connectSMP: negotiated version=" + smpVersion);
      let sessionAuthKeyPair = null;
      if (smpVersion >= 7) {
        sessionAuthKeyPair = import_tweetnacl2.default.box.keyPair();
      }
      const clientHello = encodeSMPClientHandshake({
        smpVersion,
        keyHash: server.keyHash,
        sessionAuthPubKeySPKI: sessionAuthKeyPair ? encodeX25519PublicKey(sessionAuthKeyPair.publicKey) : void 0
      });
      console.log("[SMP] connectSMP: sending ClientHello, version=" + smpVersion + ", keyHash=" + server.keyHash.length + "B" + (sessionAuthKeyPair ? ", sessionAuthKey=32B" : ""));
      if (debug) {
        debug("ClientHello full block (first 64 bytes)", clientHello.subarray(0, 64));
        debug("ClientHello keyHash", server.keyHash);
      }
      await transport.send(clientHello);
      console.log("[SMP] connectSMP: ClientHello sent, transport.state=" + transport.state);
      if (transport.state !== "connected") {
        console.log("[SMP] connectSMP: TRANSPORT DEAD after ClientHello! state=" + transport.state);
        throw new SMPTransportError(
          "HANDSHAKE",
          "Transport disconnected after ClientHello (state: " + transport.state + "). Server may have rejected the handshake."
        );
      }
      console.log("[SMP] connectSMP: HANDSHAKE COMPLETE, creating SMPClient v" + smpVersion + ", serverAuthKey=" + (serverHello.serverAuthPubKeyRaw ? serverHello.serverAuthPubKeyRaw.length + "B" : "null"));
      const client = new SMPClientImpl(
        serverHello.sessionId,
        smpVersion,
        transport,
        cfg.keepaliveIntervalMs,
        cfg.commandTimeoutMs,
        debug ?? void 0,
        serverHello.serverAuthPubKeyRaw
      );
      client.startKeepalive();
      console.log("[SMP] connectSMP: keepalive started (interval=" + cfg.keepaliveIntervalMs + "ms)");
      return client;
    } catch (e) {
      transport.close();
      throw e;
    }
  }
  function waitForBlock(transport, timeoutMs) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new SMPTransportError("TIMEOUT", "Handshake timeout: no ServerHello received"));
        }
      }, timeoutMs);
      transport.onMessage((block) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(block);
        }
      });
    });
  }

  // src/agent.ts
  var DEFAULT_AGENT_CONFIG = {
    connectTimeoutMs: 15e3,
    keepaliveIntervalMs: 3e4,
    handshakeTimeoutMs: 15e3,
    reconnectBaseMs: 500,
    reconnectMultiplier: 2,
    reconnectMaxMs: 3e4,
    reconnectJitter: 0.5,
    reconnectMaxAttempts: 12
  };
  function calculateBackoff(attempt, config = {}) {
    const base = config.reconnectBaseMs ?? DEFAULT_AGENT_CONFIG.reconnectBaseMs;
    const multiplier = config.reconnectMultiplier ?? DEFAULT_AGENT_CONFIG.reconnectMultiplier;
    const maxMs = config.reconnectMaxMs ?? DEFAULT_AGENT_CONFIG.reconnectMaxMs;
    const jitter = config.reconnectJitter ?? DEFAULT_AGENT_CONFIG.reconnectJitter;
    const delay = Math.min(base * Math.pow(multiplier, attempt), maxMs);
    const actualDelay = delay * (1 + Math.random() * jitter);
    return Math.round(actualDelay);
  }
  function serverKey(server) {
    return server.host + ":" + server.port;
  }
  var SMPClientAgentImpl = class {
    constructor(config) {
      __publicField(this, "connections", /* @__PURE__ */ new Map());
      __publicField(this, "cfg");
      __publicField(this, "connectionChangeHandler", null);
      __publicField(this, "servers", /* @__PURE__ */ new Map());
      __publicField(this, "onlineHandler");
      __publicField(this, "visibilityHandler");
      __publicField(this, "destroyed", false);
      /** Track in-progress reconnections to prevent duplicate connections */
      __publicField(this, "pendingReconnects", /* @__PURE__ */ new Map());
      // Injectable connect function for testing
      __publicField(this, "_connectFn");
      this.cfg = { ...DEFAULT_AGENT_CONFIG, ...config };
      this._connectFn = connectSMP;
      this.onlineHandler = () => {
        if (!this.destroyed) this.reconnectAllDisconnected();
      };
      this.visibilityHandler = () => {
        if (!this.destroyed && typeof document !== "undefined" && document.visibilityState === "visible") {
          this.checkStaleConnections();
        }
      };
      if (typeof window !== "undefined") {
        window.addEventListener("online", this.onlineHandler);
      }
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", this.visibilityHandler);
      }
    }
    getClient(server) {
      const key = serverKey(server);
      const existing = this.connections.get(key);
      if (existing) {
        console.log("[WS-DEBUG] getClient: reusing existing connection for " + key);
        return existing.client;
      }
      const pendingReconnect = this.pendingReconnects.get(key);
      if (pendingReconnect) {
        console.log("[WS-DEBUG] getClient: waiting for in-progress reconnect for " + key);
        return pendingReconnect;
      }
      console.log("[WS-DEBUG] getClient: creating NEW connection for " + key);
      return this.createConnection(server);
    }
    reconnect(server) {
      const key = serverKey(server);
      const old = this.connections.get(key);
      if (old) {
        old.client.then((c) => c.close(), () => {
        });
      }
      const clientPromise = this._connectFn(server, this.cfg);
      const conn = {
        client: clientPromise,
        queue: old?.queue ?? Promise.resolve()
      };
      this.connections.set(key, conn);
      this.servers.set(key, server);
      clientPromise.then(
        (client) => {
          this.emitEvent(server, { type: "connected" });
          this.wireDisconnectHandler(server, client, clientPromise);
        },
        () => {
          const cur = this.connections.get(key);
          if (cur && cur.client === clientPromise) {
            this.connections.delete(key);
            this.servers.delete(key);
          }
        }
      );
      return clientPromise;
    }
    closeServer(server) {
      const key = serverKey(server);
      const conn = this.connections.get(key);
      if (conn) {
        this.connections.delete(key);
        this.servers.delete(key);
        conn.client.then((c) => c.close(), () => {
        });
      }
    }
    closeAll() {
      this.destroyed = true;
      for (const conn of this.connections.values()) {
        conn.client.then((c) => c.close(), () => {
        });
      }
      this.connections.clear();
      this.servers.clear();
      this.pendingReconnects.clear();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", this.onlineHandler);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", this.visibilityHandler);
      }
    }
    onConnectionChange(handler) {
      this.connectionChangeHandler = handler;
    }
    // -- Internal methods
    createConnection(server) {
      const key = serverKey(server);
      console.log("[WS-DEBUG] createConnection: " + key + " (new WebSocket will be opened)");
      const clientPromise = this._connectFn(server, this.cfg);
      const conn = { client: clientPromise, queue: Promise.resolve() };
      this.connections.set(key, conn);
      this.servers.set(key, server);
      clientPromise.then(
        (client) => {
          this.emitEvent(server, { type: "connected" });
          this.wireDisconnectHandler(server, client, clientPromise);
        },
        () => {
          const cur = this.connections.get(key);
          if (cur && cur.client === clientPromise) {
            this.connections.delete(key);
            this.servers.delete(key);
          }
        }
      );
      return clientPromise;
    }
    wireDisconnectHandler(server, client, clientPromise) {
      const transport = client.transport;
      if (transport instanceof SMPWebSocketTransport) {
        const connectedAt = Date.now();
        transport.onClose(() => {
          const uptime = Date.now() - connectedAt;
          if (uptime < 5e3) {
            if (this.destroyed) return;
            const key = serverKey(server);
            const cur = this.connections.get(key);
            if (cur && cur.client === clientPromise) {
              this.connections.delete(key);
              this.servers.delete(key);
            }
            this.emitEvent(server, {
              type: "disconnected",
              reason: "Connection dropped immediately after handshake (possible handshake rejection)"
            });
            this.emitEvent(server, {
              type: "reconnect_failed",
              reason: "Not reconnecting: connection was too short-lived (uptime " + uptime + "ms)"
            });
          } else {
            this.handleDisconnect(server, clientPromise, "WebSocket connection closed");
          }
        });
      }
    }
    handleDisconnect(server, disconnectedPromise, reason) {
      if (this.destroyed) return;
      const key = serverKey(server);
      const cur = this.connections.get(key);
      if (!cur || cur.client !== disconnectedPromise) return;
      console.log("[WS-DEBUG] handleDisconnect: " + key + " - " + reason);
      this.connections.delete(key);
      this.emitEvent(server, { type: "disconnected", reason });
      const key2 = serverKey(server);
      const reconnectPromise = this.reconnectWithBackoff(server);
      this.pendingReconnects.set(key2, reconnectPromise);
      reconnectPromise.then(() => {
        this.pendingReconnects.delete(key2);
      }, () => {
        this.pendingReconnects.delete(key2);
      });
    }
    async reconnectWithBackoff(server) {
      const maxAttempts = this.cfg.reconnectMaxAttempts;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (this.destroyed) {
          throw new SMPTransportError("CLOSED", "Agent destroyed during reconnection");
        }
        const delayMs = calculateBackoff(attempt, this.cfg);
        this.emitEvent(server, {
          type: "reconnecting",
          attempt: attempt + 1,
          maxAttempts,
          nextRetryMs: delayMs
        });
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await waitForOnline();
        }
        await sleep(delayMs);
        try {
          console.log("[WS-DEBUG] reconnectWithBackoff: attempting reconnect for " + serverKey(server) + " (attempt " + (attempt + 1) + ")");
          const client = await this._connectFn(server, this.cfg);
          const key = serverKey(server);
          const conn = { client: Promise.resolve(client), queue: Promise.resolve() };
          this.connections.set(key, conn);
          this.servers.set(key, server);
          this.emitEvent(server, { type: "connected" });
          this.wireDisconnectHandler(server, client, conn.client);
          console.log("[WS-DEBUG] reconnectWithBackoff: reconnected successfully for " + key);
          return client;
        } catch (_e) {
        }
      }
      const msg = "Reconnection failed after " + maxAttempts + " attempts";
      this.emitEvent(server, { type: "reconnect_failed", reason: msg });
      throw new SMPTransportError("NETWORK", msg);
    }
    reconnectAllDisconnected() {
      for (const [key, server] of this.servers.entries()) {
        if (!this.connections.has(key)) {
          this.reconnectWithBackoff(server).catch(() => {
          });
        }
      }
    }
    checkStaleConnections() {
      for (const [key, conn] of this.connections.entries()) {
        conn.client.then((client) => {
          if (client.transport.state === "disconnected") {
            const server = this.servers.get(key);
            if (server) {
              this.handleDisconnect(server, conn.client, "Stale connection detected after tab wake");
            }
          }
        }, () => {
        });
      }
    }
    emitEvent(server, event) {
      if (this.connectionChangeHandler !== null) {
        this.connectionChangeHandler(server, event);
      }
    }
  };
  function newSMPAgent(config) {
    return new SMPClientAgentImpl(config);
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function waitForOnline() {
    return new Promise((resolve) => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        resolve();
        return;
      }
      const handler = () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("online", handler);
        }
        resolve();
      };
      if (typeof window !== "undefined") {
        window.addEventListener("online", handler);
      } else {
        resolve();
      }
    });
  }

  // src/address.ts
  var ContactAddressError = class extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
      this.name = "ContactAddressError";
    }
  };
  var BASE64URL_RE = /^[A-Za-z0-9_-]+=*$/;
  function validateBase64url(input) {
    if (input.length === 0 || !BASE64URL_RE.test(input)) {
      throw new ContactAddressError("INVALID_BASE64", "Invalid base64url encoding: " + input);
    }
    return input;
  }
  function parseVersionRange(s) {
    const dashIdx = s.indexOf("-");
    if (dashIdx === -1) {
      const v = parseInt(s, 10);
      if (isNaN(v)) throw new ContactAddressError("INVALID_VERSION", "Invalid version: " + s);
      return { min: v, max: v };
    }
    const min = parseInt(s.substring(0, dashIdx), 10);
    const max = parseInt(s.substring(dashIdx + 1), 10);
    if (isNaN(min) || isNaN(max)) {
      throw new ContactAddressError("INVALID_VERSION", "Invalid version range: " + s);
    }
    return { min, max };
  }
  function parseSMPServer(serverStr) {
    const atIdx = serverStr.indexOf("@");
    if (atIdx === -1) {
      throw new ContactAddressError("INVALID_SMP_URI", "Missing @ in server address: " + serverStr);
    }
    let identity = serverStr.substring(0, atIdx);
    try {
      identity = decodeURIComponent(identity);
    } catch (_e) {
    }
    validateBase64url(identity);
    const hostPart = serverStr.substring(atIdx + 1);
    if (hostPart.length === 0) {
      throw new ContactAddressError("MISSING_SERVER", "Empty host in server address");
    }
    const lastColon = hostPart.lastIndexOf(":");
    let hostsStr;
    let port = 5223;
    if (lastColon > 0) {
      const portCandidate = hostPart.substring(lastColon + 1);
      const portNum = parseInt(portCandidate, 10);
      if (!isNaN(portNum) && portNum > 0 && portNum <= 65535 && portCandidate === String(portNum)) {
        hostsStr = hostPart.substring(0, lastColon);
        port = portNum;
      } else {
        hostsStr = hostPart;
      }
    } else {
      hostsStr = hostPart;
    }
    const hosts = hostsStr.split(",").filter((h) => h.length > 0);
    if (hosts.length === 0) {
      throw new ContactAddressError("MISSING_SERVER", "No hosts in server address");
    }
    return { serverIdentity: identity, hosts, port };
  }
  function parseSMPQueueURI(uri) {
    if (!uri.startsWith("smp://")) {
      throw new ContactAddressError("INVALID_SMP_URI", "SMP queue URI must start with smp://");
    }
    const rest = uri.substring(6);
    const slashIdx = rest.indexOf("/");
    if (slashIdx === -1) {
      throw new ContactAddressError("INVALID_SMP_URI", "Missing queue ID in SMP URI");
    }
    const serverStr = rest.substring(0, slashIdx);
    const pathAndFragment = rest.substring(slashIdx + 1);
    const server = parseSMPServer(serverStr);
    const fragIdx = pathAndFragment.indexOf("#/?");
    if (fragIdx === -1) {
      throw new ContactAddressError("INVALID_SMP_URI", "Missing fragment (#/?) in SMP URI");
    }
    let senderId = pathAndFragment.substring(0, fragIdx);
    try {
      senderId = decodeURIComponent(senderId);
    } catch (_e) {
    }
    validateBase64url(senderId);
    const paramsStr = pathAndFragment.substring(fragIdx + 3);
    const params = parseQueryParams(paramsStr);
    const decodedParams = /* @__PURE__ */ new Map();
    for (const [k, v] of params) {
      try {
        decodedParams.set(k, decodeURIComponent(v));
      } catch (_e) {
        decodedParams.set(k, v);
      }
    }
    const vStr = decodedParams.get("v");
    if (!vStr) {
      throw new ContactAddressError("INVALID_VERSION", "Missing v= in SMP queue URI");
    }
    const smpVersion = parseVersionRange(vStr);
    const dhKey = decodedParams.get("dh");
    if (!dhKey) {
      throw new ContactAddressError("MISSING_DH_KEY", "Missing dh= in SMP queue URI");
    }
    validateBase64url(dhKey);
    const sndSecure = decodedParams.get("k") === "s";
    return { server, senderId, dhPublicKey: dhKey, smpVersion, sndSecure };
  }
  function parseContactAddress(uri) {
    if (!uri || uri.length === 0) {
      throw new ContactAddressError("INVALID_SCHEME", "Empty URI");
    }
    if (uri.startsWith("simplex:/")) {
      return parseSimplexScheme(uri);
    }
    if (uri.startsWith("https://")) {
      return parseHttpsScheme(uri);
    }
    throw new ContactAddressError("INVALID_SCHEME", "Unsupported URI scheme, expected simplex:/ or https://");
  }
  function parseSimplexScheme(uri) {
    const afterScheme = uri.substring(9);
    const hashIdx = afterScheme.indexOf("#");
    if (hashIdx === -1) {
      throw new ContactAddressError("MISSING_FRAGMENT", "Missing # fragment in URI");
    }
    const pathAndQuery = afterScheme.substring(0, hashIdx);
    const fragment = afterScheme.substring(hashIdx + 1);
    if (fragment.length === 0) {
      throw new ContactAddressError("MISSING_FRAGMENT", "Empty fragment in URI");
    }
    const qIdx = pathAndQuery.indexOf("?");
    const path = qIdx === -1 ? pathAndQuery : pathAndQuery.substring(0, qIdx);
    if (path === "contact" || path === "invitation") {
      const linkType = path === "contact" ? "contact" : "invitation";
      return parseFullLinkFragment(linkType, fragment);
    }
    if (path === "a" || path === "i") {
      const linkType = path === "a" ? "contact" : "invitation";
      const queryStr = qIdx === -1 ? "" : pathAndQuery.substring(qIdx + 1);
      const queryParams = parseQueryParams(queryStr);
      const host = queryParams.get("h");
      if (!host) {
        throw new ContactAddressError("MISSING_SERVER", "Missing ?h= host parameter in simplex:/ short link");
      }
      const portStr = queryParams.get("p");
      let port = 5223;
      if (portStr) {
        port = parseInt(portStr, 10);
        if (isNaN(port) || port <= 0 || port > 65535) {
          throw new ContactAddressError("INVALID_PORT", "Invalid port: " + portStr);
        }
      }
      const certFingerprint = queryParams.get("c");
      const fragQIdx = fragment.indexOf("?");
      const linkKey = fragQIdx === -1 ? fragment : fragment.substring(0, fragQIdx);
      validateBase64url(linkKey);
      const server = {
        serverIdentity: certFingerprint || "",
        hosts: [host],
        port
      };
      return { format: "short", data: { server, linkType, linkKey } };
    }
    throw new ContactAddressError("INVALID_PATH", "Unrecognized path: /" + path);
  }
  function parseHttpsScheme(uri) {
    const afterScheme = uri.substring(8);
    const hashIdx = afterScheme.indexOf("#");
    if (hashIdx === -1) {
      throw new ContactAddressError("MISSING_FRAGMENT", "Missing # fragment in URI");
    }
    const hostAndPath = afterScheme.substring(0, hashIdx);
    const fragment = afterScheme.substring(hashIdx + 1);
    if (fragment.length === 0) {
      throw new ContactAddressError("MISSING_FRAGMENT", "Empty fragment in URI");
    }
    const firstSlash = hostAndPath.indexOf("/");
    if (firstSlash === -1) {
      throw new ContactAddressError("INVALID_PATH", "Missing path in HTTPS URI");
    }
    const hostPart = hostAndPath.substring(0, firstSlash);
    const pathPart = hostAndPath.substring(firstSlash);
    if (pathPart === "/contact" || pathPart === "/invitation") {
      const linkType = pathPart === "/contact" ? "contact" : "invitation";
      if (fragment.startsWith("/?") || fragment.startsWith("/")) {
        return parseFullLinkFragment(linkType, fragment);
      }
      return parseHttpsShortLink(hostPart, linkType, fragment);
    }
    if (pathPart === "/a" || pathPart === "/i") {
      const linkType = pathPart === "/a" ? "contact" : "invitation";
      return parseHttpsShortLink(hostPart, linkType, fragment);
    }
    throw new ContactAddressError("INVALID_PATH", "Unrecognized path: " + pathPart);
  }
  function parseHttpsShortLink(hostPart, linkType, fragment) {
    const colonIdx = hostPart.lastIndexOf(":");
    let hostname;
    let port = 443;
    if (colonIdx > 0) {
      const portCandidate = hostPart.substring(colonIdx + 1);
      const portNum = parseInt(portCandidate, 10);
      if (!isNaN(portNum) && portNum > 0 && portNum <= 65535 && portCandidate === String(portNum)) {
        hostname = hostPart.substring(0, colonIdx);
        port = portNum;
      } else {
        hostname = hostPart;
      }
    } else {
      hostname = hostPart;
    }
    const linkKey = fragment;
    validateBase64url(linkKey);
    const server = {
      serverIdentity: "",
      hosts: [hostname],
      port
    };
    return { format: "short", data: { server, linkType, linkKey } };
  }
  function parseFullLinkFragment(linkType, fragment) {
    let paramsStr = fragment;
    if (paramsStr.startsWith("/?")) {
      paramsStr = paramsStr.substring(2);
    } else if (paramsStr.startsWith("/")) {
      paramsStr = paramsStr.substring(1);
    }
    const params = parseQueryParams(paramsStr);
    const vStr = params.get("v");
    if (!vStr) {
      throw new ContactAddressError("INVALID_VERSION", "Missing v= in contact address");
    }
    const agentVersion = parseVersionRange(vStr);
    const smpRaw = params.get("smp");
    if (!smpRaw) {
      throw new ContactAddressError("INVALID_SMP_URI", "Missing smp= in contact address");
    }
    const smpDecoded = decodeURIComponent(smpRaw);
    const queueStrs = smpDecoded.split(";").filter((s) => s.length > 0);
    if (queueStrs.length === 0) {
      throw new ContactAddressError("INVALID_SMP_URI", "Empty smp= value in contact address");
    }
    const smpQueues = queueStrs.map((q) => parseSMPQueueURI(q));
    const e2eParams = params.get("e2e") || void 0;
    return {
      format: "full",
      data: { linkType, agentVersion, smpQueues, e2eParams }
    };
  }
  function parseQueryParams(qs) {
    const params = /* @__PURE__ */ new Map();
    if (!qs || qs.length === 0) return params;
    const pairs = qs.split("&");
    for (const pair of pairs) {
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) {
        params.set(pair, "");
      } else {
        params.set(pair.substring(0, eqIdx), pair.substring(eqIdx + 1));
      }
    }
    return params;
  }

  // src/state.ts
  var TRANSITIONS = {
    NEW: {
      createQueues: "QUEUE_CREATED",
      error: "ERROR"
    },
    QUEUE_CREATED: {
      sendRequest: "PENDING",
      error: "ERROR",
      close: "CLOSED"
    },
    PENDING: {
      receiveConfirmation: "CONFIRMED",
      error: "ERROR",
      close: "CLOSED"
    },
    CONFIRMED: {
      acknowledgeConfirmation: "CONNECTED",
      error: "ERROR"
    },
    CONNECTED: {
      close: "CLOSED",
      error: "ERROR"
    },
    CLOSED: {},
    ERROR: {
      close: "CLOSED"
    }
  };
  var InvalidTransitionError = class extends Error {
    constructor(currentState, action, message) {
      super(message);
      this.currentState = currentState;
      this.action = action;
      this.name = "InvalidTransitionError";
    }
  };
  function generateConnectionId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  var QUEUE_PAIR_VALID_STATES = /* @__PURE__ */ new Set([
    "QUEUE_CREATED",
    "PENDING",
    "CONFIRMED",
    "CONNECTED"
  ]);
  var REMOTE_INFO_VALID_STATES = /* @__PURE__ */ new Set([
    "CONFIRMED",
    "CONNECTED"
  ]);
  var ConnectionStateMachine = class {
    constructor(connectionId) {
      __publicField(this, "connectionId");
      __publicField(this, "createdAt");
      __publicField(this, "currentState", "NEW");
      __publicField(this, "stateChangedAt");
      __publicField(this, "connectionError");
      __publicField(this, "queuePair");
      __publicField(this, "remoteInfo");
      __publicField(this, "contactAddress");
      __publicField(this, "listeners", []);
      __publicField(this, "transitionHistory", []);
      this.connectionId = connectionId ?? generateConnectionId();
      this.createdAt = Date.now();
      this.stateChangedAt = this.createdAt;
    }
    get info() {
      return Object.freeze({
        connectionId: this.connectionId,
        createdAt: this.createdAt,
        state: this.currentState,
        stateChangedAt: this.stateChangedAt,
        error: this.connectionError,
        contactAddress: this.contactAddress,
        queuePair: this.queuePair,
        remoteInfo: this.remoteInfo
      });
    }
    get state() {
      return this.currentState;
    }
    get id() {
      return this.connectionId;
    }
    get isTerminal() {
      return this.currentState === "CLOSED" || this.currentState === "ERROR";
    }
    get history() {
      return [...this.transitionHistory];
    }
    canTransition(action) {
      const stateTransitions = TRANSITIONS[this.currentState];
      return action in stateTransitions;
    }
    transition(action, error) {
      const stateTransitions = TRANSITIONS[this.currentState];
      const nextState = stateTransitions[action];
      if (nextState === void 0) {
        throw new InvalidTransitionError(
          this.currentState,
          action,
          "Invalid transition: cannot perform '" + action + "' from state '" + this.currentState + "'"
        );
      }
      const now = Date.now();
      const previousState = this.currentState;
      this.currentState = nextState;
      this.stateChangedAt = now;
      if (nextState === "ERROR" && error) {
        this.connectionError = error;
      }
      const event = {
        connectionId: this.connectionId,
        previousState,
        newState: nextState,
        action,
        timestamp: now,
        error: nextState === "ERROR" ? error : void 0
      };
      this.transitionHistory.push(event);
      for (const listener of this.listeners) {
        listener(event);
      }
    }
    setQueuePair(queuePair) {
      if (!QUEUE_PAIR_VALID_STATES.has(this.currentState)) {
        throw new InvalidTransitionError(
          this.currentState,
          "createQueues",
          "Cannot set queue pair in state '" + this.currentState + "'"
        );
      }
      this.queuePair = queuePair;
    }
    setRemoteInfo(remoteInfo) {
      if (!REMOTE_INFO_VALID_STATES.has(this.currentState)) {
        throw new InvalidTransitionError(
          this.currentState,
          "receiveConfirmation",
          "Cannot set remote info in state '" + this.currentState + "'"
        );
      }
      this.remoteInfo = remoteInfo;
    }
    onStateChange(listener) {
      this.listeners.push(listener);
      return () => {
        const idx = this.listeners.indexOf(listener);
        if (idx >= 0) this.listeners.splice(idx, 1);
      };
    }
  };

  // node_modules/@noble/ciphers/utils.js
  function isBytes2(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function abool2(b) {
    if (typeof b !== "boolean")
      throw new Error(`boolean expected, not ${b}`);
  }
  function anumber2(n) {
    if (!Number.isSafeInteger(n) || n < 0)
      throw new Error("positive integer expected, got " + n);
  }
  function abytes2(value, length, title = "") {
    const bytes = isBytes2(value);
    const len = value?.length;
    const needsLen = length !== void 0;
    if (!bytes || needsLen && len !== length) {
      const prefix = title && `"${title}" `;
      const ofLen = needsLen ? ` of length ${length}` : "";
      const got = bytes ? `length=${len}` : `type=${typeof value}`;
      throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
    }
    return value;
  }
  function aexists2(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput2(out, instance) {
    abytes2(out, void 0, "output");
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error("digestInto() expects output buffer of length at least " + min);
    }
  }
  function u8(arr) {
    return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function u322(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  }
  function clean2(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView2(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  var isLE2 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
  function checkOpts(defaults, opts) {
    if (opts == null || typeof opts !== "object")
      throw new Error("options must be defined");
    const merged = Object.assign(defaults, opts);
    return merged;
  }
  function equalBytes2(a, b) {
    if (a.length !== b.length)
      return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
      diff |= a[i] ^ b[i];
    return diff === 0;
  }
  var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, constructor) => {
    function wrappedCipher(key, ...args) {
      abytes2(key, void 0, "key");
      if (!isLE2)
        throw new Error("Non little-endian hardware is not yet supported");
      if (params.nonceLength !== void 0) {
        const nonce = args[0];
        abytes2(nonce, params.varSizeNonce ? void 0 : params.nonceLength, "nonce");
      }
      const tagl = params.tagLength;
      if (tagl && args[1] !== void 0)
        abytes2(args[1], void 0, "AAD");
      const cipher = constructor(key, ...args);
      const checkOutput = (fnLength, output) => {
        if (output !== void 0) {
          if (fnLength !== 2)
            throw new Error("cipher output not supported");
          abytes2(output, void 0, "output");
        }
      };
      let called = false;
      const wrCipher = {
        encrypt(data, output) {
          if (called)
            throw new Error("cannot encrypt() twice with same key + nonce");
          called = true;
          abytes2(data);
          checkOutput(cipher.encrypt.length, output);
          return cipher.encrypt(data, output);
        },
        decrypt(data, output) {
          abytes2(data);
          if (tagl && data.length < tagl)
            throw new Error('"ciphertext" expected length bigger than tagLength=' + tagl);
          checkOutput(cipher.decrypt.length, output);
          return cipher.decrypt(data, output);
        }
      };
      return wrCipher;
    }
    Object.assign(wrappedCipher, params);
    return wrappedCipher;
  };
  function getOutput(expectedLength, out, onlyAligned = true) {
    if (out === void 0)
      return new Uint8Array(expectedLength);
    if (out.length !== expectedLength)
      throw new Error('"output" expected Uint8Array of length ' + expectedLength + ", got: " + out.length);
    if (onlyAligned && !isAligned32(out))
      throw new Error("invalid output, must be aligned");
    return out;
  }
  function u64Lengths(dataLength, aadLength, isLE3) {
    abool2(isLE3);
    const num = new Uint8Array(16);
    const view = createView2(num);
    view.setBigUint64(0, BigInt(aadLength), isLE3);
    view.setBigUint64(8, BigInt(dataLength), isLE3);
    return num;
  }
  function isAligned32(bytes) {
    return bytes.byteOffset % 4 === 0;
  }
  function copyBytes2(bytes) {
    return Uint8Array.from(bytes);
  }

  // node_modules/@noble/ciphers/_arx.js
  var encodeStr = (str) => Uint8Array.from(str.split(""), (c) => c.charCodeAt(0));
  var sigma16 = encodeStr("expand 16-byte k");
  var sigma32 = encodeStr("expand 32-byte k");
  var sigma16_32 = u322(sigma16);
  var sigma32_32 = u322(sigma32);
  function rotl(a, b) {
    return a << b | a >>> 32 - b;
  }
  function isAligned322(b) {
    return b.byteOffset % 4 === 0;
  }
  var BLOCK_LEN = 64;
  var BLOCK_LEN32 = 16;
  var MAX_COUNTER = 2 ** 32 - 1;
  var U32_EMPTY = Uint32Array.of();
  function runCipher(core, sigma, key, nonce, data, output, counter, rounds) {
    const len = data.length;
    const block = new Uint8Array(BLOCK_LEN);
    const b32 = u322(block);
    const isAligned = isAligned322(data) && isAligned322(output);
    const d32 = isAligned ? u322(data) : U32_EMPTY;
    const o32 = isAligned ? u322(output) : U32_EMPTY;
    for (let pos = 0; pos < len; counter++) {
      core(sigma, key, nonce, b32, counter, rounds);
      if (counter >= MAX_COUNTER)
        throw new Error("arx: counter overflow");
      const take = Math.min(BLOCK_LEN, len - pos);
      if (isAligned && take === BLOCK_LEN) {
        const pos32 = pos / 4;
        if (pos % 4 !== 0)
          throw new Error("arx: invalid block position");
        for (let j = 0, posj; j < BLOCK_LEN32; j++) {
          posj = pos32 + j;
          o32[posj] = d32[posj] ^ b32[j];
        }
        pos += BLOCK_LEN;
        continue;
      }
      for (let j = 0, posj; j < take; j++) {
        posj = pos + j;
        output[posj] = data[posj] ^ block[j];
      }
      pos += take;
    }
  }
  function createCipher(core, opts) {
    const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
    if (typeof core !== "function")
      throw new Error("core must be a function");
    anumber2(counterLength);
    anumber2(rounds);
    abool2(counterRight);
    abool2(allowShortKeys);
    return (key, nonce, data, output, counter = 0) => {
      abytes2(key, void 0, "key");
      abytes2(nonce, void 0, "nonce");
      abytes2(data, void 0, "data");
      const len = data.length;
      if (output === void 0)
        output = new Uint8Array(len);
      abytes2(output, void 0, "output");
      anumber2(counter);
      if (counter < 0 || counter >= MAX_COUNTER)
        throw new Error("arx: counter overflow");
      if (output.length < len)
        throw new Error(`arx: output (${output.length}) is shorter than data (${len})`);
      const toClean = [];
      let l = key.length;
      let k;
      let sigma;
      if (l === 32) {
        toClean.push(k = copyBytes2(key));
        sigma = sigma32_32;
      } else if (l === 16 && allowShortKeys) {
        k = new Uint8Array(32);
        k.set(key);
        k.set(key, 16);
        sigma = sigma16_32;
        toClean.push(k);
      } else {
        abytes2(key, 32, "arx key");
        throw new Error("invalid key size");
      }
      if (!isAligned322(nonce))
        toClean.push(nonce = copyBytes2(nonce));
      const k32 = u322(k);
      if (extendNonceFn) {
        if (nonce.length !== 24)
          throw new Error(`arx: extended nonce must be 24 bytes`);
        extendNonceFn(sigma, k32, u322(nonce.subarray(0, 16)), k32);
        nonce = nonce.subarray(16);
      }
      const nonceNcLen = 16 - counterLength;
      if (nonceNcLen !== nonce.length)
        throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
      if (nonceNcLen !== 12) {
        const nc = new Uint8Array(12);
        nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
        nonce = nc;
        toClean.push(nonce);
      }
      const n32 = u322(nonce);
      runCipher(core, sigma, k32, n32, data, output, counter, rounds);
      clean2(...toClean);
      return output;
    };
  }

  // node_modules/@noble/ciphers/_poly1305.js
  function u8to16(a, i) {
    return a[i++] & 255 | (a[i++] & 255) << 8;
  }
  var Poly1305 = class {
    // Can be speed-up using BigUint64Array, at the cost of complexity
    constructor(key) {
      __publicField(this, "blockLen", 16);
      __publicField(this, "outputLen", 16);
      __publicField(this, "buffer", new Uint8Array(16));
      __publicField(this, "r", new Uint16Array(10));
      // Allocating 1 array with .subarray() here is slower than 3
      __publicField(this, "h", new Uint16Array(10));
      __publicField(this, "pad", new Uint16Array(8));
      __publicField(this, "pos", 0);
      __publicField(this, "finished", false);
      key = copyBytes2(abytes2(key, 32, "key"));
      const t0 = u8to16(key, 0);
      const t1 = u8to16(key, 2);
      const t2 = u8to16(key, 4);
      const t3 = u8to16(key, 6);
      const t4 = u8to16(key, 8);
      const t5 = u8to16(key, 10);
      const t6 = u8to16(key, 12);
      const t7 = u8to16(key, 14);
      this.r[0] = t0 & 8191;
      this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
      this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
      this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
      this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
      this.r[5] = t4 >>> 1 & 8190;
      this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
      this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
      this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
      this.r[9] = t7 >>> 5 & 127;
      for (let i = 0; i < 8; i++)
        this.pad[i] = u8to16(key, 16 + 2 * i);
    }
    process(data, offset, isLast = false) {
      const hibit = isLast ? 0 : 1 << 11;
      const { h, r } = this;
      const r0 = r[0];
      const r1 = r[1];
      const r2 = r[2];
      const r3 = r[3];
      const r4 = r[4];
      const r5 = r[5];
      const r6 = r[6];
      const r7 = r[7];
      const r8 = r[8];
      const r9 = r[9];
      const t0 = u8to16(data, offset + 0);
      const t1 = u8to16(data, offset + 2);
      const t2 = u8to16(data, offset + 4);
      const t3 = u8to16(data, offset + 6);
      const t4 = u8to16(data, offset + 8);
      const t5 = u8to16(data, offset + 10);
      const t6 = u8to16(data, offset + 12);
      const t7 = u8to16(data, offset + 14);
      let h0 = h[0] + (t0 & 8191);
      let h1 = h[1] + ((t0 >>> 13 | t1 << 3) & 8191);
      let h2 = h[2] + ((t1 >>> 10 | t2 << 6) & 8191);
      let h3 = h[3] + ((t2 >>> 7 | t3 << 9) & 8191);
      let h4 = h[4] + ((t3 >>> 4 | t4 << 12) & 8191);
      let h5 = h[5] + (t4 >>> 1 & 8191);
      let h6 = h[6] + ((t4 >>> 14 | t5 << 2) & 8191);
      let h7 = h[7] + ((t5 >>> 11 | t6 << 5) & 8191);
      let h8 = h[8] + ((t6 >>> 8 | t7 << 8) & 8191);
      let h9 = h[9] + (t7 >>> 5 | hibit);
      let c = 0;
      let d0 = c + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
      c = d0 >>> 13;
      d0 &= 8191;
      d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r2) + h9 * (5 * r1);
      c += d0 >>> 13;
      d0 &= 8191;
      let d1 = c + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
      c = d1 >>> 13;
      d1 &= 8191;
      d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r2);
      c += d1 >>> 13;
      d1 &= 8191;
      let d2 = c + h0 * r2 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
      c = d2 >>> 13;
      d2 &= 8191;
      d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
      c += d2 >>> 13;
      d2 &= 8191;
      let d3 = c + h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
      c = d3 >>> 13;
      d3 &= 8191;
      d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
      c += d3 >>> 13;
      d3 &= 8191;
      let d4 = c + h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
      c = d4 >>> 13;
      d4 &= 8191;
      d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
      c += d4 >>> 13;
      d4 &= 8191;
      let d5 = c + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r2 + h4 * r1;
      c = d5 >>> 13;
      d5 &= 8191;
      d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
      c += d5 >>> 13;
      d5 &= 8191;
      let d6 = c + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r2;
      c = d6 >>> 13;
      d6 &= 8191;
      d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
      c += d6 >>> 13;
      d6 &= 8191;
      let d7 = c + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
      c = d7 >>> 13;
      d7 &= 8191;
      d7 += h5 * r2 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
      c += d7 >>> 13;
      d7 &= 8191;
      let d8 = c + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
      c = d8 >>> 13;
      d8 &= 8191;
      d8 += h5 * r3 + h6 * r2 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
      c += d8 >>> 13;
      d8 &= 8191;
      let d9 = c + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
      c = d9 >>> 13;
      d9 &= 8191;
      d9 += h5 * r4 + h6 * r3 + h7 * r2 + h8 * r1 + h9 * r0;
      c += d9 >>> 13;
      d9 &= 8191;
      c = (c << 2) + c | 0;
      c = c + d0 | 0;
      d0 = c & 8191;
      c = c >>> 13;
      d1 += c;
      h[0] = d0;
      h[1] = d1;
      h[2] = d2;
      h[3] = d3;
      h[4] = d4;
      h[5] = d5;
      h[6] = d6;
      h[7] = d7;
      h[8] = d8;
      h[9] = d9;
    }
    finalize() {
      const { h, pad: pad2 } = this;
      const g = new Uint16Array(10);
      let c = h[1] >>> 13;
      h[1] &= 8191;
      for (let i = 2; i < 10; i++) {
        h[i] += c;
        c = h[i] >>> 13;
        h[i] &= 8191;
      }
      h[0] += c * 5;
      c = h[0] >>> 13;
      h[0] &= 8191;
      h[1] += c;
      c = h[1] >>> 13;
      h[1] &= 8191;
      h[2] += c;
      g[0] = h[0] + 5;
      c = g[0] >>> 13;
      g[0] &= 8191;
      for (let i = 1; i < 10; i++) {
        g[i] = h[i] + c;
        c = g[i] >>> 13;
        g[i] &= 8191;
      }
      g[9] -= 1 << 13;
      let mask = (c ^ 1) - 1;
      for (let i = 0; i < 10; i++)
        g[i] &= mask;
      mask = ~mask;
      for (let i = 0; i < 10; i++)
        h[i] = h[i] & mask | g[i];
      h[0] = (h[0] | h[1] << 13) & 65535;
      h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
      h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
      h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
      h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
      h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
      h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
      h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
      let f = h[0] + pad2[0];
      h[0] = f & 65535;
      for (let i = 1; i < 8; i++) {
        f = (h[i] + pad2[i] | 0) + (f >>> 16) | 0;
        h[i] = f & 65535;
      }
      clean2(g);
    }
    update(data) {
      aexists2(this);
      abytes2(data);
      data = copyBytes2(data);
      const { buffer, blockLen } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(data, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(buffer, 0, false);
          this.pos = 0;
        }
      }
      return this;
    }
    destroy() {
      clean2(this.h, this.r, this.buffer, this.pad);
    }
    digestInto(out) {
      aexists2(this);
      aoutput2(out, this);
      this.finished = true;
      const { buffer, h } = this;
      let { pos } = this;
      if (pos) {
        buffer[pos++] = 1;
        for (; pos < 16; pos++)
          buffer[pos] = 0;
        this.process(buffer, 0, true);
      }
      this.finalize();
      let opos = 0;
      for (let i = 0; i < 8; i++) {
        out[opos++] = h[i] >>> 0;
        out[opos++] = h[i] >>> 8;
      }
      return out;
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
  };
  function wrapConstructorWithKey(hashCons) {
    const hashC = (msg, key) => hashCons(key).update(msg).digest();
    const tmp = hashCons(new Uint8Array(32));
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (key) => hashCons(key);
    return hashC;
  }
  var poly1305 = /* @__PURE__ */ (() => wrapConstructorWithKey((key) => new Poly1305(key)))();

  // node_modules/@noble/ciphers/salsa.js
  function salsaCore(s, k, n, out, cnt, rounds = 20) {
    let y00 = s[0], y01 = k[0], y02 = k[1], y03 = k[2], y04 = k[3], y05 = s[1], y06 = n[0], y07 = n[1], y08 = cnt, y09 = 0, y10 = s[2], y11 = k[4], y12 = k[5], y13 = k[6], y14 = k[7], y15 = s[3];
    let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
    for (let r = 0; r < rounds; r += 2) {
      x04 ^= rotl(x00 + x12 | 0, 7);
      x08 ^= rotl(x04 + x00 | 0, 9);
      x12 ^= rotl(x08 + x04 | 0, 13);
      x00 ^= rotl(x12 + x08 | 0, 18);
      x09 ^= rotl(x05 + x01 | 0, 7);
      x13 ^= rotl(x09 + x05 | 0, 9);
      x01 ^= rotl(x13 + x09 | 0, 13);
      x05 ^= rotl(x01 + x13 | 0, 18);
      x14 ^= rotl(x10 + x06 | 0, 7);
      x02 ^= rotl(x14 + x10 | 0, 9);
      x06 ^= rotl(x02 + x14 | 0, 13);
      x10 ^= rotl(x06 + x02 | 0, 18);
      x03 ^= rotl(x15 + x11 | 0, 7);
      x07 ^= rotl(x03 + x15 | 0, 9);
      x11 ^= rotl(x07 + x03 | 0, 13);
      x15 ^= rotl(x11 + x07 | 0, 18);
      x01 ^= rotl(x00 + x03 | 0, 7);
      x02 ^= rotl(x01 + x00 | 0, 9);
      x03 ^= rotl(x02 + x01 | 0, 13);
      x00 ^= rotl(x03 + x02 | 0, 18);
      x06 ^= rotl(x05 + x04 | 0, 7);
      x07 ^= rotl(x06 + x05 | 0, 9);
      x04 ^= rotl(x07 + x06 | 0, 13);
      x05 ^= rotl(x04 + x07 | 0, 18);
      x11 ^= rotl(x10 + x09 | 0, 7);
      x08 ^= rotl(x11 + x10 | 0, 9);
      x09 ^= rotl(x08 + x11 | 0, 13);
      x10 ^= rotl(x09 + x08 | 0, 18);
      x12 ^= rotl(x15 + x14 | 0, 7);
      x13 ^= rotl(x12 + x15 | 0, 9);
      x14 ^= rotl(x13 + x12 | 0, 13);
      x15 ^= rotl(x14 + x13 | 0, 18);
    }
    let oi = 0;
    out[oi++] = y00 + x00 | 0;
    out[oi++] = y01 + x01 | 0;
    out[oi++] = y02 + x02 | 0;
    out[oi++] = y03 + x03 | 0;
    out[oi++] = y04 + x04 | 0;
    out[oi++] = y05 + x05 | 0;
    out[oi++] = y06 + x06 | 0;
    out[oi++] = y07 + x07 | 0;
    out[oi++] = y08 + x08 | 0;
    out[oi++] = y09 + x09 | 0;
    out[oi++] = y10 + x10 | 0;
    out[oi++] = y11 + x11 | 0;
    out[oi++] = y12 + x12 | 0;
    out[oi++] = y13 + x13 | 0;
    out[oi++] = y14 + x14 | 0;
    out[oi++] = y15 + x15 | 0;
  }
  function hsalsa(s, k, i, out) {
    let x00 = s[0], x01 = k[0], x02 = k[1], x03 = k[2], x04 = k[3], x05 = s[1], x06 = i[0], x07 = i[1], x08 = i[2], x09 = i[3], x10 = s[2], x11 = k[4], x12 = k[5], x13 = k[6], x14 = k[7], x15 = s[3];
    for (let r = 0; r < 20; r += 2) {
      x04 ^= rotl(x00 + x12 | 0, 7);
      x08 ^= rotl(x04 + x00 | 0, 9);
      x12 ^= rotl(x08 + x04 | 0, 13);
      x00 ^= rotl(x12 + x08 | 0, 18);
      x09 ^= rotl(x05 + x01 | 0, 7);
      x13 ^= rotl(x09 + x05 | 0, 9);
      x01 ^= rotl(x13 + x09 | 0, 13);
      x05 ^= rotl(x01 + x13 | 0, 18);
      x14 ^= rotl(x10 + x06 | 0, 7);
      x02 ^= rotl(x14 + x10 | 0, 9);
      x06 ^= rotl(x02 + x14 | 0, 13);
      x10 ^= rotl(x06 + x02 | 0, 18);
      x03 ^= rotl(x15 + x11 | 0, 7);
      x07 ^= rotl(x03 + x15 | 0, 9);
      x11 ^= rotl(x07 + x03 | 0, 13);
      x15 ^= rotl(x11 + x07 | 0, 18);
      x01 ^= rotl(x00 + x03 | 0, 7);
      x02 ^= rotl(x01 + x00 | 0, 9);
      x03 ^= rotl(x02 + x01 | 0, 13);
      x00 ^= rotl(x03 + x02 | 0, 18);
      x06 ^= rotl(x05 + x04 | 0, 7);
      x07 ^= rotl(x06 + x05 | 0, 9);
      x04 ^= rotl(x07 + x06 | 0, 13);
      x05 ^= rotl(x04 + x07 | 0, 18);
      x11 ^= rotl(x10 + x09 | 0, 7);
      x08 ^= rotl(x11 + x10 | 0, 9);
      x09 ^= rotl(x08 + x11 | 0, 13);
      x10 ^= rotl(x09 + x08 | 0, 18);
      x12 ^= rotl(x15 + x14 | 0, 7);
      x13 ^= rotl(x12 + x15 | 0, 9);
      x14 ^= rotl(x13 + x12 | 0, 13);
      x15 ^= rotl(x14 + x13 | 0, 18);
    }
    let oi = 0;
    out[oi++] = x00;
    out[oi++] = x05;
    out[oi++] = x10;
    out[oi++] = x15;
    out[oi++] = x06;
    out[oi++] = x07;
    out[oi++] = x08;
    out[oi++] = x09;
  }
  var xsalsa20 = /* @__PURE__ */ createCipher(salsaCore, {
    counterRight: true,
    extendNonceFn: hsalsa
  });
  var xsalsa20poly1305 = /* @__PURE__ */ wrapCipher({ blockSize: 64, nonceLength: 24, tagLength: 16 }, (key, nonce) => {
    return {
      encrypt(plaintext, output) {
        output = getOutput(plaintext.length + 32, output, false);
        const authKey = output.subarray(0, 32);
        const ciphPlaintext = output.subarray(32);
        output.set(plaintext, 32);
        clean2(authKey);
        xsalsa20(key, nonce, output, output);
        const tag = poly1305(ciphPlaintext, authKey);
        output.set(tag, 16);
        clean2(output.subarray(0, 16), tag);
        return output.subarray(16);
      },
      decrypt(ciphertext, output) {
        abytes2(ciphertext);
        output = getOutput(ciphertext.length + 32, output, false);
        const tmp = output.subarray(0, 32);
        const passedTag = output.subarray(32, 48);
        const ciphPlaintext = output.subarray(48);
        output.set(ciphertext, 32);
        clean2(tmp);
        const authKey = xsalsa20(key, nonce, tmp, tmp);
        const tag = poly1305(ciphPlaintext, authKey);
        if (!equalBytes2(passedTag, tag))
          throw new Error("invalid tag");
        xsalsa20(key, nonce, output.subarray(16), output.subarray(16));
        clean2(tmp, passedTag, tag);
        return ciphPlaintext;
      }
    };
  });

  // src/x3dh.ts
  var import_hkdf = __toESM(require_hkdf(), 1);
  var import_sha5122 = __toESM(require_sha512(), 1);
  var X3DH_SALT = new Uint8Array(32);
  var X3DH_INFO = new TextEncoder().encode("SimpleXX3DH");
  function performX3DH(ourKeys, theirKey1, theirKey2) {
    const dh1 = x448DH(ourKeys.key1.privateKey, theirKey1);
    const dh2 = x448DH(ourKeys.key1.privateKey, theirKey2);
    const dh3 = x448DH(ourKeys.key2.privateKey, theirKey1);
    const dh4 = x448DH(ourKeys.key2.privateKey, theirKey2);
    const ikm = new Uint8Array(224);
    ikm.set(dh1, 0);
    ikm.set(dh2, 56);
    ikm.set(dh3, 112);
    ikm.set(dh4, 168);
    const output = (0, import_hkdf.hkdf)(import_sha5122.sha512, ikm, X3DH_SALT, X3DH_INFO, 96);
    return {
      rootKey: output.slice(0, 32),
      headerKey: output.slice(32, 64),
      nextHeaderKey: output.slice(64, 96)
    };
  }

  // src/ratchet.ts
  var import_hkdf2 = __toESM(require_hkdf(), 1);
  var import_sha2562 = __toESM(require_sha256(), 1);

  // node_modules/@noble/ciphers/_polyval.js
  var BLOCK_SIZE = 16;
  var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
  var ZEROS32 = u322(ZEROS16);
  var POLY = 225;
  var mul2 = (s0, s1, s2, s3) => {
    const hiBit = s3 & 1;
    return {
      s3: s2 << 31 | s3 >>> 1,
      s2: s1 << 31 | s2 >>> 1,
      s1: s0 << 31 | s1 >>> 1,
      s0: s0 >>> 1 ^ POLY << 24 & -(hiBit & 1)
      // reduce % poly
    };
  };
  var swapLE = (n) => (n >>> 0 & 255) << 24 | (n >>> 8 & 255) << 16 | (n >>> 16 & 255) << 8 | n >>> 24 & 255 | 0;
  function _toGHASHKey(k) {
    k.reverse();
    const hiBit = k[15] & 1;
    let carry = 0;
    for (let i = 0; i < k.length; i++) {
      const t = k[i];
      k[i] = t >>> 1 | carry;
      carry = (t & 1) << 7;
    }
    k[0] ^= -hiBit & 225;
    return k;
  }
  var estimateWindow = (bytes) => {
    if (bytes > 64 * 1024)
      return 8;
    if (bytes > 1024)
      return 4;
    return 2;
  };
  var GHASH = class {
    // We select bits per window adaptively based on expectedLength
    constructor(key, expectedLength) {
      __publicField(this, "blockLen", BLOCK_SIZE);
      __publicField(this, "outputLen", BLOCK_SIZE);
      __publicField(this, "s0", 0);
      __publicField(this, "s1", 0);
      __publicField(this, "s2", 0);
      __publicField(this, "s3", 0);
      __publicField(this, "finished", false);
      __publicField(this, "t");
      __publicField(this, "W");
      __publicField(this, "windowSize");
      abytes2(key, 16, "key");
      key = copyBytes2(key);
      const kView = createView2(key);
      let k0 = kView.getUint32(0, false);
      let k1 = kView.getUint32(4, false);
      let k2 = kView.getUint32(8, false);
      let k3 = kView.getUint32(12, false);
      const doubles = [];
      for (let i = 0; i < 128; i++) {
        doubles.push({ s0: swapLE(k0), s1: swapLE(k1), s2: swapLE(k2), s3: swapLE(k3) });
        ({ s0: k0, s1: k1, s2: k2, s3: k3 } = mul2(k0, k1, k2, k3));
      }
      const W = estimateWindow(expectedLength || 1024);
      if (![1, 2, 4, 8].includes(W))
        throw new Error("ghash: invalid window size, expected 2, 4 or 8");
      this.W = W;
      const bits = 128;
      const windows = bits / W;
      const windowSize = this.windowSize = 2 ** W;
      const items = [];
      for (let w = 0; w < windows; w++) {
        for (let byte = 0; byte < windowSize; byte++) {
          let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
          for (let j = 0; j < W; j++) {
            const bit = byte >>> W - j - 1 & 1;
            if (!bit)
              continue;
            const { s0: d0, s1: d1, s2: d2, s3: d3 } = doubles[W * w + j];
            s0 ^= d0, s1 ^= d1, s2 ^= d2, s3 ^= d3;
          }
          items.push({ s0, s1, s2, s3 });
        }
      }
      this.t = items;
    }
    _updateBlock(s0, s1, s2, s3) {
      s0 ^= this.s0, s1 ^= this.s1, s2 ^= this.s2, s3 ^= this.s3;
      const { W, t, windowSize } = this;
      let o0 = 0, o1 = 0, o2 = 0, o3 = 0;
      const mask = (1 << W) - 1;
      let w = 0;
      for (const num of [s0, s1, s2, s3]) {
        for (let bytePos = 0; bytePos < 4; bytePos++) {
          const byte = num >>> 8 * bytePos & 255;
          for (let bitPos = 8 / W - 1; bitPos >= 0; bitPos--) {
            const bit = byte >>> W * bitPos & mask;
            const { s0: e0, s1: e1, s2: e2, s3: e3 } = t[w * windowSize + bit];
            o0 ^= e0, o1 ^= e1, o2 ^= e2, o3 ^= e3;
            w += 1;
          }
        }
      }
      this.s0 = o0;
      this.s1 = o1;
      this.s2 = o2;
      this.s3 = o3;
    }
    update(data) {
      aexists2(this);
      abytes2(data);
      data = copyBytes2(data);
      const b32 = u322(data);
      const blocks = Math.floor(data.length / BLOCK_SIZE);
      const left = data.length % BLOCK_SIZE;
      for (let i = 0; i < blocks; i++) {
        this._updateBlock(b32[i * 4 + 0], b32[i * 4 + 1], b32[i * 4 + 2], b32[i * 4 + 3]);
      }
      if (left) {
        ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
        this._updateBlock(ZEROS32[0], ZEROS32[1], ZEROS32[2], ZEROS32[3]);
        clean2(ZEROS32);
      }
      return this;
    }
    destroy() {
      const { t } = this;
      for (const elm of t) {
        elm.s0 = 0, elm.s1 = 0, elm.s2 = 0, elm.s3 = 0;
      }
    }
    digestInto(out) {
      aexists2(this);
      aoutput2(out, this);
      this.finished = true;
      const { s0, s1, s2, s3 } = this;
      const o32 = u322(out);
      o32[0] = s0;
      o32[1] = s1;
      o32[2] = s2;
      o32[3] = s3;
      return out;
    }
    digest() {
      const res = new Uint8Array(BLOCK_SIZE);
      this.digestInto(res);
      this.destroy();
      return res;
    }
  };
  var Polyval = class extends GHASH {
    constructor(key, expectedLength) {
      abytes2(key);
      const ghKey = _toGHASHKey(copyBytes2(key));
      super(ghKey, expectedLength);
      clean2(ghKey);
    }
    update(data) {
      aexists2(this);
      abytes2(data);
      data = copyBytes2(data);
      const b32 = u322(data);
      const left = data.length % BLOCK_SIZE;
      const blocks = Math.floor(data.length / BLOCK_SIZE);
      for (let i = 0; i < blocks; i++) {
        this._updateBlock(swapLE(b32[i * 4 + 3]), swapLE(b32[i * 4 + 2]), swapLE(b32[i * 4 + 1]), swapLE(b32[i * 4 + 0]));
      }
      if (left) {
        ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
        this._updateBlock(swapLE(ZEROS32[3]), swapLE(ZEROS32[2]), swapLE(ZEROS32[1]), swapLE(ZEROS32[0]));
        clean2(ZEROS32);
      }
      return this;
    }
    digestInto(out) {
      aexists2(this);
      aoutput2(out, this);
      this.finished = true;
      const { s0, s1, s2, s3 } = this;
      const o32 = u322(out);
      o32[0] = s0;
      o32[1] = s1;
      o32[2] = s2;
      o32[3] = s3;
      return out.reverse();
    }
  };
  function wrapConstructorWithKey2(hashCons) {
    const hashC = (msg, key) => hashCons(key, msg.length).update(msg).digest();
    const tmp = hashCons(new Uint8Array(16), 0);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (key, expectedLength) => hashCons(key, expectedLength);
    return hashC;
  }
  var ghash = wrapConstructorWithKey2((key, expectedLength) => new GHASH(key, expectedLength));
  var polyval = wrapConstructorWithKey2((key, expectedLength) => new Polyval(key, expectedLength));

  // node_modules/@noble/ciphers/aes.js
  var BLOCK_SIZE2 = 16;
  var BLOCK_SIZE32 = 4;
  var EMPTY_BLOCK = /* @__PURE__ */ new Uint8Array(BLOCK_SIZE2);
  var POLY2 = 283;
  function validateKeyLength(key) {
    if (![16, 24, 32].includes(key.length))
      throw new Error('"aes key" expected Uint8Array of length 16/24/32, got length=' + key.length);
  }
  function mul22(n) {
    return n << 1 ^ POLY2 & -(n >> 7);
  }
  function mul(a, b) {
    let res = 0;
    for (; b > 0; b >>= 1) {
      res ^= a & -(b & 1);
      a = mul22(a);
    }
    return res;
  }
  var sbox = /* @__PURE__ */ (() => {
    const t = new Uint8Array(256);
    for (let i = 0, x = 1; i < 256; i++, x ^= mul22(x))
      t[i] = x;
    const box = new Uint8Array(256);
    box[0] = 99;
    for (let i = 0; i < 255; i++) {
      let x = t[255 - i];
      x |= x << 8;
      box[t[i]] = (x ^ x >> 4 ^ x >> 5 ^ x >> 6 ^ x >> 7 ^ 99) & 255;
    }
    clean2(t);
    return box;
  })();
  var rotr32_8 = (n) => n << 24 | n >>> 8;
  var rotl32_8 = (n) => n << 8 | n >>> 24;
  function genTtable(sbox2, fn) {
    if (sbox2.length !== 256)
      throw new Error("Wrong sbox length");
    const T0 = new Uint32Array(256).map((_, j) => fn(sbox2[j]));
    const T1 = T0.map(rotl32_8);
    const T2 = T1.map(rotl32_8);
    const T3 = T2.map(rotl32_8);
    const T01 = new Uint32Array(256 * 256);
    const T23 = new Uint32Array(256 * 256);
    const sbox22 = new Uint16Array(256 * 256);
    for (let i = 0; i < 256; i++) {
      for (let j = 0; j < 256; j++) {
        const idx = i * 256 + j;
        T01[idx] = T0[i] ^ T1[j];
        T23[idx] = T2[i] ^ T3[j];
        sbox22[idx] = sbox2[i] << 8 | sbox2[j];
      }
    }
    return { sbox: sbox2, sbox2: sbox22, T0, T1, T2, T3, T01, T23 };
  }
  var tableEncoding = /* @__PURE__ */ genTtable(sbox, (s) => mul(s, 3) << 24 | s << 16 | s << 8 | mul(s, 2));
  var xPowers = /* @__PURE__ */ (() => {
    const p = new Uint8Array(16);
    for (let i = 0, x = 1; i < 16; i++, x = mul22(x))
      p[i] = x;
    return p;
  })();
  function expandKeyLE(key) {
    abytes2(key);
    const len = key.length;
    validateKeyLength(key);
    const { sbox2 } = tableEncoding;
    const toClean = [];
    if (!isAligned32(key))
      toClean.push(key = copyBytes2(key));
    const k32 = u322(key);
    const Nk = k32.length;
    const subByte = (n) => applySbox(sbox2, n, n, n, n);
    const xk = new Uint32Array(len + 28);
    xk.set(k32);
    for (let i = Nk; i < xk.length; i++) {
      let t = xk[i - 1];
      if (i % Nk === 0)
        t = subByte(rotr32_8(t)) ^ xPowers[i / Nk - 1];
      else if (Nk > 6 && i % Nk === 4)
        t = subByte(t);
      xk[i] = xk[i - Nk] ^ t;
    }
    clean2(...toClean);
    return xk;
  }
  function apply0123(T01, T23, s0, s1, s2, s3) {
    return T01[s0 << 8 & 65280 | s1 >>> 8 & 255] ^ T23[s2 >>> 8 & 65280 | s3 >>> 24 & 255];
  }
  function applySbox(sbox2, s0, s1, s2, s3) {
    return sbox2[s0 & 255 | s1 & 65280] | sbox2[s2 >>> 16 & 255 | s3 >>> 16 & 65280] << 16;
  }
  function encrypt(xk, s0, s1, s2, s3) {
    const { sbox2, T01, T23 } = tableEncoding;
    let k = 0;
    s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
    const rounds = xk.length / 4 - 2;
    for (let i = 0; i < rounds; i++) {
      const t02 = xk[k++] ^ apply0123(T01, T23, s0, s1, s2, s3);
      const t12 = xk[k++] ^ apply0123(T01, T23, s1, s2, s3, s0);
      const t22 = xk[k++] ^ apply0123(T01, T23, s2, s3, s0, s1);
      const t32 = xk[k++] ^ apply0123(T01, T23, s3, s0, s1, s2);
      s0 = t02, s1 = t12, s2 = t22, s3 = t32;
    }
    const t0 = xk[k++] ^ applySbox(sbox2, s0, s1, s2, s3);
    const t1 = xk[k++] ^ applySbox(sbox2, s1, s2, s3, s0);
    const t2 = xk[k++] ^ applySbox(sbox2, s2, s3, s0, s1);
    const t3 = xk[k++] ^ applySbox(sbox2, s3, s0, s1, s2);
    return { s0: t0, s1: t1, s2: t2, s3: t3 };
  }
  function ctr32(xk, isLE3, nonce, src, dst) {
    abytes2(nonce, BLOCK_SIZE2, "nonce");
    abytes2(src);
    dst = getOutput(src.length, dst);
    const ctr = nonce;
    const c32 = u322(ctr);
    const view = createView2(ctr);
    const src32 = u322(src);
    const dst32 = u322(dst);
    const ctrPos = isLE3 ? 0 : 12;
    const srcLen = src.length;
    let ctrNum = view.getUint32(ctrPos, isLE3);
    let { s0, s1, s2, s3 } = encrypt(xk, c32[0], c32[1], c32[2], c32[3]);
    for (let i = 0; i + 4 <= src32.length; i += 4) {
      dst32[i + 0] = src32[i + 0] ^ s0;
      dst32[i + 1] = src32[i + 1] ^ s1;
      dst32[i + 2] = src32[i + 2] ^ s2;
      dst32[i + 3] = src32[i + 3] ^ s3;
      ctrNum = ctrNum + 1 >>> 0;
      view.setUint32(ctrPos, ctrNum, isLE3);
      ({ s0, s1, s2, s3 } = encrypt(xk, c32[0], c32[1], c32[2], c32[3]));
    }
    const start = BLOCK_SIZE2 * Math.floor(src32.length / BLOCK_SIZE32);
    if (start < srcLen) {
      const b32 = new Uint32Array([s0, s1, s2, s3]);
      const buf = u8(b32);
      for (let i = start, pos = 0; i < srcLen; i++, pos++)
        dst[i] = src[i] ^ buf[pos];
      clean2(b32);
    }
    return dst;
  }
  function computeTag(fn, isLE3, key, data, AAD) {
    const aadLength = AAD ? AAD.length : 0;
    const h = fn.create(key, data.length + aadLength);
    if (AAD)
      h.update(AAD);
    const num = u64Lengths(8 * data.length, 8 * aadLength, isLE3);
    h.update(data);
    h.update(num);
    const res = h.digest();
    clean2(num);
    return res;
  }
  var gcm = /* @__PURE__ */ wrapCipher({ blockSize: 16, nonceLength: 12, tagLength: 16, varSizeNonce: true }, function aesgcm(key, nonce, AAD) {
    if (nonce.length < 8)
      throw new Error("aes/gcm: invalid nonce length");
    const tagLength = 16;
    function _computeTag(authKey, tagMask, data) {
      const tag = computeTag(ghash, false, authKey, data, AAD);
      for (let i = 0; i < tagMask.length; i++)
        tag[i] ^= tagMask[i];
      return tag;
    }
    function deriveKeys() {
      const xk = expandKeyLE(key);
      const authKey = EMPTY_BLOCK.slice();
      const counter = EMPTY_BLOCK.slice();
      ctr32(xk, false, counter, counter, authKey);
      if (nonce.length === 12) {
        counter.set(nonce);
      } else {
        const nonceLen = EMPTY_BLOCK.slice();
        const view = createView2(nonceLen);
        view.setBigUint64(8, BigInt(nonce.length * 8), false);
        const g = ghash.create(authKey).update(nonce).update(nonceLen);
        g.digestInto(counter);
        g.destroy();
      }
      const tagMask = ctr32(xk, false, counter, EMPTY_BLOCK);
      return { xk, authKey, counter, tagMask };
    }
    return {
      encrypt(plaintext) {
        const { xk, authKey, counter, tagMask } = deriveKeys();
        const out = new Uint8Array(plaintext.length + tagLength);
        const toClean = [xk, authKey, counter, tagMask];
        if (!isAligned32(plaintext))
          toClean.push(plaintext = copyBytes2(plaintext));
        ctr32(xk, false, counter, plaintext, out.subarray(0, plaintext.length));
        const tag = _computeTag(authKey, tagMask, out.subarray(0, out.length - tagLength));
        toClean.push(tag);
        out.set(tag, plaintext.length);
        clean2(...toClean);
        return out;
      },
      decrypt(ciphertext) {
        const { xk, authKey, counter, tagMask } = deriveKeys();
        const toClean = [xk, authKey, tagMask, counter];
        if (!isAligned32(ciphertext))
          toClean.push(ciphertext = copyBytes2(ciphertext));
        const data = ciphertext.subarray(0, -tagLength);
        const passedTag = ciphertext.subarray(-tagLength);
        const tag = _computeTag(authKey, tagMask, data);
        toClean.push(tag);
        if (!equalBytes2(tag, passedTag))
          throw new Error("aes/gcm: invalid ghash tag");
        const out = ctr32(xk, false, counter, data);
        clean2(...toClean);
        return out;
      }
    };
  });
  function isBytes32(a) {
    return a instanceof Uint32Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint32Array";
  }
  function encryptBlock(xk, block) {
    abytes2(block, 16, "block");
    if (!isBytes32(xk))
      throw new Error("_encryptBlock accepts result of expandKeyLE");
    const b32 = u322(block);
    let { s0, s1, s2, s3 } = encrypt(xk, b32[0], b32[1], b32[2], b32[3]);
    b32[0] = s0, b32[1] = s1, b32[2] = s2, b32[3] = s3;
    return block;
  }
  function dbl(block) {
    let carry = 0;
    for (let i = BLOCK_SIZE2 - 1; i >= 0; i--) {
      const newCarry = (block[i] & 128) >>> 7;
      block[i] = block[i] << 1 | carry;
      carry = newCarry;
    }
    if (carry) {
      block[BLOCK_SIZE2 - 1] ^= 135;
    }
    return block;
  }
  function xorBlock(a, b) {
    if (a.length !== b.length)
      throw new Error("xorBlock: blocks must have same length");
    for (let i = 0; i < a.length; i++) {
      a[i] = a[i] ^ b[i];
    }
    return a;
  }
  var _CMAC = class {
    constructor(key) {
      __publicField(this, "buffer");
      __publicField(this, "destroyed");
      __publicField(this, "k1");
      __publicField(this, "k2");
      __publicField(this, "xk");
      abytes2(key);
      validateKeyLength(key);
      this.xk = expandKeyLE(key);
      this.buffer = new Uint8Array(0);
      this.destroyed = false;
      const L = new Uint8Array(BLOCK_SIZE2);
      encryptBlock(this.xk, L);
      this.k1 = dbl(L);
      this.k2 = dbl(new Uint8Array(this.k1));
    }
    update(data) {
      const { destroyed, buffer } = this;
      if (destroyed)
        throw new Error("CMAC instance was destroyed");
      abytes2(data);
      const newBuffer = new Uint8Array(buffer.length + data.length);
      newBuffer.set(buffer);
      newBuffer.set(data, buffer.length);
      this.buffer = newBuffer;
      return this;
    }
    // see https://www.rfc-editor.org/rfc/rfc4493.html#section-2.4
    digest() {
      if (this.destroyed)
        throw new Error("CMAC instance was destroyed");
      const { buffer } = this;
      const msgLen = buffer.length;
      let n = Math.ceil(msgLen / BLOCK_SIZE2);
      let flag;
      if (n === 0) {
        n = 1;
        flag = false;
      } else {
        flag = msgLen % BLOCK_SIZE2 === 0;
      }
      const lastBlockStart = (n - 1) * BLOCK_SIZE2;
      const lastBlockData = buffer.subarray(lastBlockStart);
      let m_last;
      if (flag) {
        m_last = xorBlock(new Uint8Array(lastBlockData), this.k1);
      } else {
        const padded = new Uint8Array(BLOCK_SIZE2);
        padded.set(lastBlockData);
        padded[lastBlockData.length] = 128;
        m_last = xorBlock(padded, this.k2);
      }
      let x = new Uint8Array(BLOCK_SIZE2);
      for (let i = 0; i < n - 1; i++) {
        const m_i = buffer.subarray(i * BLOCK_SIZE2, (i + 1) * BLOCK_SIZE2);
        xorBlock(x, m_i);
        encryptBlock(this.xk, x);
      }
      xorBlock(x, m_last);
      encryptBlock(this.xk, x);
      clean2(m_last);
      return x;
    }
    destroy() {
      const { buffer, destroyed, xk, k1, k2 } = this;
      if (destroyed)
        return;
      this.destroyed = true;
      clean2(buffer, xk, k1, k2);
    }
  };
  var cmac = (key, message) => new _CMAC(key).update(message).digest();
  cmac.create = (key) => new _CMAC(key);

  // src/ratchet.ts
  var MK_INFO = new TextEncoder().encode("SimpleXMK");
  var CK_INFO = new TextEncoder().encode("SimpleXCK");
  var KDF_SALT = new Uint8Array(32);
  var HEADER_PAD_SIZE = 2346;
  function initSendRatchet(x3dhResult, ratchetKeyPair) {
    const chainKey = (0, import_hkdf2.hkdf)(import_sha2562.sha256, x3dhResult.rootKey, KDF_SALT, CK_INFO, 32);
    return {
      rootKey: x3dhResult.rootKey,
      chainKey: new Uint8Array(chainKey),
      headerKey: x3dhResult.headerKey,
      nextHeaderKey: x3dhResult.nextHeaderKey,
      ratchetPublicKey: ratchetKeyPair.publicKey,
      messageNumber: 0,
      previousChainLength: 0
    };
  }
  function deriveMessageKey(chainKey) {
    const messageKey = (0, import_hkdf2.hkdf)(import_sha2562.sha256, chainKey, KDF_SALT, MK_INFO, 32);
    const nextChainKey = (0, import_hkdf2.hkdf)(import_sha2562.sha256, chainKey, KDF_SALT, CK_INFO, 32);
    return {
      messageKey: new Uint8Array(messageKey),
      nextChainKey: new Uint8Array(nextChainKey)
    };
  }
  function buildBodyIV(messageNumber) {
    const iv = new Uint8Array(12);
    iv[0] = messageNumber >>> 24 & 255;
    iv[1] = messageNumber >>> 16 & 255;
    iv[2] = messageNumber >>> 8 & 255;
    iv[3] = messageNumber & 255;
    return iv;
  }
  function buildHeader(ratchetPublicKey, previousChainLength, messageNumber) {
    const header = new Uint8Array(HEADER_PAD_SIZE);
    header.set(ratchetPublicKey, 0);
    header[56] = previousChainLength >>> 24 & 255;
    header[57] = previousChainLength >>> 16 & 255;
    header[58] = previousChainLength >>> 8 & 255;
    header[59] = previousChainLength & 255;
    header[60] = messageNumber >>> 24 & 255;
    header[61] = messageNumber >>> 16 & 255;
    header[62] = messageNumber >>> 8 & 255;
    header[63] = messageNumber & 255;
    return header;
  }
  function ratchetEncrypt(state, plaintext) {
    const { messageKey, nextChainKey } = deriveMessageKey(state.chainKey);
    const bodyIV = buildBodyIV(state.messageNumber);
    const bodyGcm = gcm(messageKey, bodyIV);
    const encryptedBody = bodyGcm.encrypt(plaintext);
    const headerPlaintext = buildHeader(
      state.ratchetPublicKey,
      state.previousChainLength,
      state.messageNumber
    );
    const headerNonce = new Uint8Array(12);
    crypto.getRandomValues(headerNonce);
    const headerGcm = gcm(state.headerKey, headerNonce);
    const encryptedHeader = headerGcm.encrypt(headerPlaintext);
    state.chainKey = nextChainKey;
    state.messageNumber += 1;
    const envelope = new Uint8Array(12 + encryptedHeader.length + encryptedBody.length);
    envelope.set(headerNonce, 0);
    envelope.set(encryptedHeader, 12);
    envelope.set(encryptedBody, 12 + encryptedHeader.length);
    return envelope;
  }

  // src/agent-envelope.ts
  function buildAgentConfirmation(params) {
    const { ratchetPublicKeySPKI, ephemeralPublicKeySPKI, encryptedConnInfo } = params;
    const fixedSize = 144;
    const total = fixedSize + encryptedConnInfo.length;
    const buf = new Uint8Array(total);
    let offset = 0;
    buf[offset++] = 0;
    buf[offset++] = 7;
    buf[offset++] = 67;
    buf[offset++] = 49;
    buf[offset++] = 0;
    buf[offset++] = 2;
    buf[offset++] = 68;
    buf.set(ratchetPublicKeySPKI, offset);
    offset += 68;
    buf[offset++] = 68;
    buf.set(ephemeralPublicKeySPKI, offset);
    offset += 68;
    buf.set(encryptedConnInfo, offset);
    return buf;
  }

  // src/connection-request.ts
  function buildConnInfoJSON(displayName) {
    return JSON.stringify({
      v: "1-16",
      event: "x.info",
      params: {
        profile: {
          displayName,
          fullName: "",
          preferences: {
            calls: { allow: "no" },
            files: { allow: "no" },
            voice: { allow: "no" },
            reactions: { allow: "yes" },
            fullDelete: { allow: "no" },
            timedMessages: { allow: "yes" }
          }
        }
      }
    });
  }
  var zstdSimple = null;
  var zstdInitPromise = null;
  async function ensureZstd() {
    if (zstdSimple) return;
    if (zstdInitPromise) {
      await zstdInitPromise;
      return;
    }
    zstdInitPromise = new Promise((resolve, reject) => {
      try {
        const { ZstdCodec } = __require("zstd-codec");
        ZstdCodec.run((zstd) => {
          zstdSimple = new zstd.Simple();
          resolve();
        });
      } catch (e) {
        reject(new Error("Failed to initialize zstd-codec: " + String(e)));
      }
    });
    await zstdInitPromise;
  }
  async function zstdCompress(data) {
    await ensureZstd();
    return zstdSimple.compress(data, 3);
  }
  function buildSmpEncConfirmation(smpVersion, bobDhPublicKeySPKI, smpConfirmation, sharedSecret) {
    const padded = new Uint8Array(15920);
    padded.set(smpConfirmation, 0);
    for (let i = smpConfirmation.length; i < 15920; i++) {
      padded[i] = 35;
    }
    const nonce = new Uint8Array(24);
    crypto.getRandomValues(nonce);
    const cipher = xsalsa20poly1305(sharedSecret, nonce);
    const encrypted = cipher.encrypt(padded);
    const headerSize = 2 + 1 + 1 + 44;
    const total = headerSize + 24 + encrypted.length;
    const result = new Uint8Array(total);
    let offset = 0;
    result[offset++] = smpVersion >>> 8 & 255;
    result[offset++] = smpVersion & 255;
    result[offset++] = 49;
    result[offset++] = 44;
    result.set(bobDhPublicKeySPKI, offset);
    offset += 44;
    result.set(nonce, offset);
    offset += 24;
    result.set(encrypted, offset);
    return result;
  }
  function buildSmpConfirmation(agentEnvelope) {
    const result = new Uint8Array(1 + agentEnvelope.length);
    result[0] = 95;
    result.set(agentEnvelope, 1);
    return result;
  }
  function buildSmpConfirmationWithKey(senderAuthKeySPKI, agentEnvelope) {
    const result = new Uint8Array(1 + 1 + 44 + agentEnvelope.length);
    let offset = 0;
    result[offset++] = 75;
    result[offset++] = 44;
    result.set(senderAuthKeySPKI, offset);
    offset += 44;
    result.set(agentEnvelope, offset);
    return result;
  }
  async function buildConnectionRequest(conn, params, aliceKey1Raw, aliceKey2Raw) {
    const json = buildConnInfoJSON(params.displayName);
    const jsonBytes = new TextEncoder().encode(json);
    const compressed = await zstdCompress(jsonBytes);
    const bobKey1 = generateX448KeyPair();
    const bobKey2 = generateX448KeyPair();
    const x448Keys = { key1: bobKey1, key2: bobKey2 };
    const x3dhResult = performX3DH(x448Keys, aliceKey1Raw, aliceKey2Raw);
    const ratchetState = initSendRatchet(x3dhResult, bobKey1);
    const encryptedConnInfo = ratchetEncrypt(ratchetState, compressed);
    const agentEnvelope = buildAgentConfirmation({
      ratchetPublicKeySPKI: encodeX448PublicKey(bobKey1.publicKey),
      ephemeralPublicKeySPKI: encodeX448PublicKey(bobKey2.publicKey),
      encryptedConnInfo
    });
    const senderAuth = generateEd25519KeyPair();
    const senderAuthKeySPKI = encodeEd25519PublicKey(senderAuth.publicKey);
    const smpConfirmation = buildSmpConfirmationWithKey(senderAuthKeySPKI, agentEnvelope);
    if (!conn.contactQueue) {
      throw new Error("Cannot send connection request: contactQueue is null (short link not resolved)");
    }
    const aliceDhPublicRaw = base64urlDecodeRaw(conn.contactQueue.dhPublicKey);
    const aliceDhRaw = aliceDhPublicRaw.length === 44 ? aliceDhPublicRaw.subarray(12) : aliceDhPublicRaw;
    const sharedSecret = x25519DH(conn.keys.e2eDh.privateKey, aliceDhRaw);
    const bobDhPublicSPKI = new Uint8Array(44);
    bobDhPublicSPKI.set(new Uint8Array([48, 42, 48, 5, 6, 3, 43, 101, 110, 3, 33, 0]), 0);
    bobDhPublicSPKI.set(conn.keys.e2eDh.publicKey, 12);
    const smpEncConfirmation = buildSmpEncConfirmation(
      conn.state.info.queuePair ? 7 : 7,
      // SMP version from handshake
      bobDhPublicSPKI,
      smpConfirmation,
      sharedSecret
    );
    return { smpEncConfirmation, senderAuthKeySPKI, x448Keys };
  }
  function base64urlDecodeRaw(s) {
    let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // src/invitation.ts
  var import_tweetnacl3 = __toESM(require_nacl_fast(), 1);
  var E2E_ENC_CONFIRMATION_LENGTH = 15904;
  function hex(bytes, n = 32) {
    return Array.from(bytes.slice(0, n)).map((b) => b.toString(16).padStart(2, "0")).join(" ");
  }
  function b64urlEncode(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function padPlaintext(plaintext, targetSize) {
    if (2 + plaintext.length > targetSize) {
      throw new Error("padPlaintext: too large: " + (2 + plaintext.length) + " > " + targetSize);
    }
    const padded = new Uint8Array(targetSize);
    padded[0] = plaintext.length >>> 8 & 255;
    padded[1] = plaintext.length & 255;
    padded.set(plaintext, 2);
    for (let i = 2 + plaintext.length; i < targetSize; i++) padded[i] = 35;
    return padded;
  }
  function buildInvitationConnInfo(displayName) {
    return new TextEncoder().encode(JSON.stringify({
      v: "1-16",
      event: "x.info",
      params: { profile: { displayName, fullName: "" } }
    }));
  }
  function buildConnReqURI(serverIdentity, host, port, senderId, queueDhSPKI, e2ePubKey1SPKI, e2ePubKey2SPKI) {
    const senderIdB64 = b64urlEncode(senderId);
    const dhB64 = b64urlEncode(queueDhSPKI);
    const smpUri = "smp://" + serverIdentity + "@" + host + ":" + port + "/" + senderIdB64 + "#/?v=1-4&dh=" + dhB64 + "&q=m";
    const key1B64 = b64urlEncode(e2ePubKey1SPKI);
    const key2B64 = b64urlEncode(e2ePubKey2SPKI);
    const e2eParams = "v=2-3&x3dh=" + key1B64 + "," + key2B64;
    return "simplex:/invitation#/?v=2-7&smp=" + encodeURIComponent(smpUri) + "&e2e=" + encodeURIComponent(e2eParams);
  }
  function buildAgentInvitation(connReqURI, connInfo) {
    const connReqBytes = new TextEncoder().encode(connReqURI);
    const total = 2 + 1 + 2 + connReqBytes.length + connInfo.length;
    const buf = new Uint8Array(total);
    let o = 0;
    buf[o++] = 0;
    buf[o++] = 7;
    buf[o++] = 73;
    buf[o++] = connReqBytes.length >>> 8 & 255;
    buf[o++] = connReqBytes.length & 255;
    buf.set(connReqBytes, o);
    o += connReqBytes.length;
    buf.set(connInfo, o);
    return buf;
  }
  function buildClientMessage(agentInvitation) {
    const r = new Uint8Array(1 + agentInvitation.length);
    r[0] = 95;
    r.set(agentInvitation, 1);
    return r;
  }
  function buildClientMsgEnvelope(dhPublicSPKI, nonce, cmEncBody) {
    const r = new Uint8Array(2 + 1 + 1 + 44 + 24 + cmEncBody.length);
    let o = 0;
    r[o++] = 0;
    r[o++] = 4;
    r[o++] = 49;
    r[o++] = 44;
    r.set(dhPublicSPKI, o);
    o += 44;
    r.set(nonce, o);
    o += 24;
    r.set(cmEncBody, o);
    return r;
  }
  async function buildInvitation(conn, displayName, _smpVersion) {
    if (!conn.contactQueue) throw new Error("Cannot build invitation: contactQueue is null");
    if (!conn.receiveQueue) throw new Error("Cannot build invitation: receiveQueue is null (IDS not received)");
    const aliceDhBase64 = conn.contactQueue.dhPublicKey;
    const aliceDhDecoded = b64decode(aliceDhBase64);
    const aliceDhRaw = aliceDhDecoded.length === 44 ? aliceDhDecoded.subarray(12) : aliceDhDecoded;
    console.log("[SMP] DIAG NaCl dh= base64url:", aliceDhBase64);
    console.log("[SMP] DIAG NaCl peer_dh RAW (" + aliceDhRaw.length + "B):", hex(aliceDhRaw, 32));
    const ratchetKeyPair = generateX448KeyPair();
    const ephemeralKeyPair = generateX448KeyPair();
    const connInfo = buildInvitationConnInfo(displayName);
    const queueDhKeyPair = generateX25519KeyPair();
    const queueDhSPKI = encodeX25519PublicKey(queueDhKeyPair.publicKey);
    const ratchetSPKI = encodeX448PublicKey(ratchetKeyPair.publicKey);
    const ephemeralSPKI = encodeX448PublicKey(ephemeralKeyPair.publicKey);
    const connReqURI = buildConnReqURI(
      conn.contactQueue.server.serverIdentity,
      conn.contactQueue.server.hosts[0],
      5223,
      conn.receiveQueue.senderId,
      queueDhSPKI,
      ratchetSPKI,
      ephemeralSPKI
    );
    console.log("[SMP] DIAG connReq URI:", connReqURI);
    console.log("[SMP] DIAG connReq URI length:", connReqURI.length);
    const agentInv = buildAgentInvitation(connReqURI, connInfo);
    console.log("[SMP] DIAG agentInvitation:", agentInv.length + "B");
    console.log("[SMP] DIAG agentInvitation[0-2]:", hex(agentInv.subarray(0, 3), 3), "(expected: 00 07 49)");
    const clientMsg = buildClientMessage(agentInv);
    console.log("[SMP] DIAG clientMessage:", clientMsg.length + "B");
    console.log("[SMP] DIAG clientMessage[0]:", "0x" + clientMsg[0].toString(16), "(expected: 0x5f = '_' PHEmpty)");
    console.log("[SMP] DIAG clientMessage[1-3]:", hex(clientMsg.subarray(1, 4), 3), "(expected: 00 07 49)");
    const phKeyPair = import_tweetnacl3.default.box.keyPair();
    console.log("[SMP] DIAG NaCl our_dh_pub  RAW (" + phKeyPair.publicKey.length + "B):", hex(phKeyPair.publicKey, 32));
    const paddedClientMsg = padPlaintext(clientMsg, E2E_ENC_CONFIRMATION_LENGTH);
    console.log("[SMP] DIAG NaCl plaintext padded:", paddedClientMsg.length + "B");
    console.log("[SMP] DIAG NaCl plaintext[0-1] (length BE):", hex(paddedClientMsg.subarray(0, 2), 2), "= " + (paddedClientMsg[0] << 8 | paddedClientMsg[1]) + " bytes");
    const nonce = import_tweetnacl3.default.randomBytes(24);
    console.log("[SMP] DIAG NaCl cmNonce (" + nonce.length + "B):", hex(nonce, 24));
    console.log("[SMP] DIAG NaCl function: nacl.box (tweetnacl - DH + HSalsa20 + XSalsa20-Poly1305)");
    const cmEncBody = import_tweetnacl3.default.box(paddedClientMsg, nonce, aliceDhRaw, phKeyPair.secretKey);
    console.log("[SMP] DIAG NaCl cmEncBody:", cmEncBody.length + "B (expected 15920)");
    const phDhPublicSPKI = encodeX25519PublicKey(phKeyPair.publicKey);
    const smpEnc = buildClientMsgEnvelope(phDhPublicSPKI, nonce, cmEncBody);
    console.log("[SMP] DIAG envelope:", smpEnc.length + "B (expected 15992)");
    console.log("[SMP] DIAG clientMessage FULL HEX (" + clientMsg.length + "B):");
    for (let i = 0; i < clientMsg.length; i += 64) {
      console.log("[SMP]   [" + String(i).padStart(3, "0") + "]", hex(clientMsg.subarray(i, Math.min(i + 64, clientMsg.length)), 64));
    }
    return {
      smpEncConfirmation: smpEnc,
      ratchetKeyPair,
      ephemeralKeyPair,
      queueDhKeyPair
    };
  }
  function b64decode(s) {
    if (!s || s.length === 0) return new Uint8Array(0);
    let b = s.replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4 !== 0) b += "=";
    const bin = atob(b);
    const r = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) r[i] = bin.charCodeAt(i);
    return r;
  }

  // src/msg-decrypt.ts
  var import_tweetnacl4 = __toESM(require_nacl_fast(), 1);
  function decryptMsgBody(encBody, msgId, serverDhPubKeyRaw, recipientDhPrivKeyRaw) {
    return import_tweetnacl4.default.box.open(encBody, msgId, serverDhPubKeyRaw, recipientDhPrivKeyRaw);
  }
  function parseRcvMsgBody(decrypted) {
    const secondsHi = (decrypted[0] << 24 | decrypted[1] << 16 | decrypted[2] << 8 | decrypted[3]) >>> 0;
    const secondsLo = (decrypted[4] << 24 | decrypted[5] << 16 | decrypted[6] << 8 | decrypted[7]) >>> 0;
    const seconds = secondsHi * 4294967296 + secondsLo;
    const nanoseconds = (decrypted[8] << 24 | decrypted[9] << 16 | decrypted[10] << 8 | decrypted[11]) >>> 0;
    const msgFlags = decrypted[12];
    const bodyStart = 14;
    let bodyEnd = decrypted.length;
    while (bodyEnd > bodyStart && decrypted[bodyEnd - 1] === 35) {
      bodyEnd--;
    }
    const msgBody = decrypted.subarray(bodyStart, bodyEnd);
    console.log("[SMP] parseRcvMsgBody: msgBody first 20B:", Array.from(msgBody.subarray(0, Math.min(20, msgBody.length))).map((b) => b.toString(16).padStart(2, "0")).join(" "));
    return {
      msgTs: { seconds, nanoseconds },
      msgFlags,
      msgBody
    };
  }
  function extractRawX25519(key) {
    if (key.length === 44) return key.subarray(12);
    if (key.length === 32) return key;
    throw new Error("unexpected X25519 key length: " + key.length);
  }

  // src/layer1-decrypt.ts
  var import_tweetnacl5 = __toESM(require_nacl_fast(), 1);
  function parseSmpEncConfirmation(data) {
    let offset = 0;
    const maybeTag = data[offset];
    offset += 1;
    let aliceDhPublicKeyRaw;
    if (maybeTag === 49) {
      const keyLen = data[offset];
      offset += 1;
      const keySpki = data.subarray(offset, offset + keyLen);
      offset += keyLen;
      aliceDhPublicKeyRaw = keySpki.length === 44 ? keySpki.subarray(12) : keySpki;
    } else if (maybeTag === 48) {
      aliceDhPublicKeyRaw = null;
    } else {
      throw new Error("smpEncConfirmation: unexpected Maybe tag 0x" + maybeTag.toString(16));
    }
    const nonce = data.subarray(offset, offset + 24);
    offset += 24;
    const encryptedBody = data.subarray(offset);
    return { aliceDhPublicKeyRaw, nonce, encryptedBody };
  }
  function decryptLayer1(envelope, e2eDhPrivateKey, storedAliceDhKey) {
    const aliceKey = envelope.aliceDhPublicKeyRaw ?? storedAliceDhKey;
    if (!aliceKey) {
      console.log("[SMP] decryptLayer1: no DH key available (Nothing in envelope and no stored key)");
      return null;
    }
    const decrypted = import_tweetnacl5.default.box.open(
      envelope.encryptedBody,
      envelope.nonce,
      aliceKey,
      e2eDhPrivateKey
    );
    if (!decrypted) return null;
    const contentLen = decrypted[0] << 8 | decrypted[1];
    return decrypted.subarray(2, 2 + contentLen);
  }
  function parseSmpConfirmation(data) {
    let offset = 0;
    const tag = data[offset];
    offset += 1;
    let senderAuthKeySPKI = null;
    if (tag === 75) {
      const keyLen = data[offset];
      offset += 1;
      senderAuthKeySPKI = data.subarray(offset, offset + keyLen);
      offset += keyLen;
    } else if (tag === 95) {
    } else {
      throw new Error("smpConfirmation: unknown tag 0x" + tag.toString(16));
    }
    return {
      senderAuthKeySPKI,
      agentConfirmation: data.subarray(offset)
    };
  }

  // src/agent-confirmation.ts
  var X448_SPKI_SIZE = 68;
  var X448_RAW_SIZE = 56;
  var X448_RAW_OFFSET = 12;
  var PQ_RATCHET_VERSION = 3;
  function parseAgentConfirmation(data) {
    let offset = 0;
    const agentVersion = data[offset] << 8 | data[offset + 1];
    offset += 2;
    console.log("[DIAG] agentVersion: " + agentVersion);
    const tag = data[offset];
    offset += 1;
    if (tag !== 67) {
      throw new Error("Expected AgentConfirmation tag 'C' (0x43), got 0x" + tag.toString(16));
    }
    console.log("[DIAG] tag: 'C' (AgentConfirmation)");
    const maybeByte = data[offset];
    offset += 1;
    if (maybeByte === 48) {
      throw new Error("AgentConfirmation has no e2eEncryption (Nothing) - cannot do X3DH");
    }
    if (maybeByte !== 49) {
      throw new Error("Expected Maybe '0' (0x30) or '1' (0x31), got 0x" + maybeByte.toString(16));
    }
    console.log("[DIAG] e2eEncryption: Just (present)");
    const e2eVersion = data[offset] << 8 | data[offset + 1];
    offset += 2;
    console.log("[DIAG] e2eVersion: " + e2eVersion);
    const key1Len = data[offset];
    offset += 1;
    if (key1Len !== X448_SPKI_SIZE) {
      throw new Error("key1 SPKI length " + key1Len + " != expected " + X448_SPKI_SIZE);
    }
    const key1Spki = data.slice(offset, offset + key1Len);
    offset += key1Len;
    validateSpkiX448(key1Spki, "key1");
    const key1Raw = key1Spki.slice(X448_RAW_OFFSET, X448_RAW_OFFSET + X448_RAW_SIZE);
    const key2Len = data[offset];
    offset += 1;
    if (key2Len !== X448_SPKI_SIZE) {
      throw new Error("key2 SPKI length " + key2Len + " != expected " + X448_SPKI_SIZE);
    }
    const key2Spki = data.slice(offset, offset + key2Len);
    offset += key2Len;
    validateSpkiX448(key2Spki, "key2");
    const key2Raw = key2Spki.slice(X448_RAW_OFFSET, X448_RAW_OFFSET + X448_RAW_SIZE);
    console.log("[DIAG] key1Raw: " + hexPrefix(key1Raw));
    console.log("[DIAG] key2Raw: " + hexPrefix(key2Raw));
    let kemParams;
    if (e2eVersion >= PQ_RATCHET_VERSION) {
      const kemResult = parseMaybeKemParams(data, offset);
      kemParams = kemResult.params;
      offset = kemResult.newOffset;
      console.log("[DIAG] KEM: " + (kemParams ? kemParams.type : "Nothing"));
    }
    const e2eEncryption = {
      e2eVersion,
      key1Spki,
      key1Raw,
      key2Spki,
      key2Raw,
      kemParams
    };
    const encConnInfo = data.slice(offset);
    console.log("[DIAG] encConnInfo: " + encConnInfo.length + " bytes (starts: " + hexPrefix(encConnInfo) + ")");
    return { agentVersion, e2eEncryption, encConnInfo };
  }
  function validateSpkiX448(spki, label) {
    if (spki[0] !== 48 || spki[1] !== 66) {
      throw new Error(label + ": Bad SPKI header, expected 30 42, got " + hexBytes(spki, 0, 2));
    }
    if (spki[4] !== 6 || spki[5] !== 3 || spki[6] !== 43 || spki[7] !== 101 || spki[8] !== 111) {
      throw new Error(label + ": Bad OID, expected 06 03 2b 65 6f (X448), got " + hexBytes(spki, 4, 5));
    }
  }
  function readWord16Prefixed(data, offset) {
    const len = data[offset] << 8 | data[offset + 1];
    offset += 2;
    const value = data.slice(offset, offset + len);
    return { value, newOffset: offset + len };
  }
  function parseMaybeKemParams(data, offset) {
    const maybeByte = data[offset];
    offset += 1;
    if (maybeByte === 48) {
      return { params: void 0, newOffset: offset };
    }
    if (maybeByte !== 49) {
      throw new Error("KEM Maybe: expected '0'/'1', got 0x" + maybeByte.toString(16));
    }
    const kemTag = data[offset];
    offset += 1;
    if (kemTag === 80) {
      const keyResult = readWord16Prefixed(data, offset);
      console.log("[DIAG] KEM Proposed: key " + keyResult.value.length + " bytes");
      return { params: { type: "proposed", publicKey: keyResult.value }, newOffset: keyResult.newOffset };
    }
    if (kemTag === 65) {
      const ctResult = readWord16Prefixed(data, offset);
      const keyResult = readWord16Prefixed(data, ctResult.newOffset);
      console.log("[DIAG] KEM Accepted: ct " + ctResult.value.length + "B, key " + keyResult.value.length + "B");
      return {
        params: { type: "accepted", publicKey: keyResult.value, ciphertext: ctResult.value },
        newOffset: keyResult.newOffset
      };
    }
    throw new Error("KEM tag: expected 'P' (0x50) or 'A' (0x41), got 0x" + kemTag.toString(16));
  }
  function hexBytes(data, offset, count) {
    return Array.from(data.slice(offset, offset + count)).map((b) => b.toString(16).padStart(2, "0")).join(" ");
  }
  function hexPrefix(data, n = 8) {
    const show = Math.min(n, data.length);
    return hexBytes(data, 0, show) + (data.length > show ? "..." : "");
  }

  // src/x3dh-agreement.ts
  var import_hkdf3 = __toESM(require_hkdf(), 1);
  var import_sha5123 = __toESM(require_sha512(), 1);
  var X3DH_SALT_LEN = 64;
  var X3DH_INFO2 = "SimpleXX3DH";
  var X3DH_OUTPUT_LEN = 96;
  var X448_KEY_LEN = 56;
  function x3dhReceiver(ourKey1, ourKey2, peerKey1, peerKey2) {
    if (peerKey1.length !== X448_KEY_LEN) {
      throw new Error("peerKey1 size " + peerKey1.length + " != " + X448_KEY_LEN);
    }
    if (peerKey2.length !== X448_KEY_LEN) {
      throw new Error("peerKey2 size " + peerKey2.length + " != " + X448_KEY_LEN);
    }
    const dh1 = x448.scalarMult(ourKey1.privateKey, peerKey2);
    const dh2 = x448.scalarMult(ourKey2.privateKey, peerKey1);
    const dh3 = x448.scalarMult(ourKey2.privateKey, peerKey2);
    console.log("[DIAG] X3DH dh1: " + hexPrefix2(dh1));
    console.log("[DIAG] X3DH dh2: " + hexPrefix2(dh2));
    console.log("[DIAG] X3DH dh3: " + hexPrefix2(dh3));
    const dhs = new Uint8Array(3 * X448_KEY_LEN);
    dhs.set(dh1, 0);
    dhs.set(dh2, X448_KEY_LEN);
    dhs.set(dh3, 2 * X448_KEY_LEN);
    const salt = new Uint8Array(X3DH_SALT_LEN);
    const output = (0, import_hkdf3.hkdf)(import_sha5123.sha512, dhs, salt, X3DH_INFO2, X3DH_OUTPUT_LEN);
    const sndHK = new Uint8Array(output.slice(0, 32));
    const rcvNextHK = new Uint8Array(output.slice(32, 64));
    const ratchetKey = new Uint8Array(output.slice(64, 96));
    console.log("[DIAG] X3DH sndHK: " + hexPrefix2(sndHK));
    console.log("[DIAG] X3DH rcvNextHK: " + hexPrefix2(rcvNextHK));
    console.log("[DIAG] X3DH ratchetKey: " + hexPrefix2(ratchetKey));
    const assocData = new Uint8Array(2 * X448_KEY_LEN);
    assocData.set(peerKey1, 0);
    assocData.set(ourKey1.publicKey, X448_KEY_LEN);
    console.log("[DIAG] X3DH assocData (112B): " + hexPrefix2(assocData, 16));
    return { assocData, ratchetKey, sndHK, rcvNextHK };
  }
  function hexPrefix2(data, n = 8) {
    const show = Math.min(n, data.length);
    return Array.from(data.slice(0, show)).map((b) => b.toString(16).padStart(2, "0")).join(" ") + (data.length > show ? "..." : "");
  }

  // src/ratchet-decrypt.ts
  var import_hkdf4 = __toESM(require_hkdf(), 1);
  var import_sha5124 = __toESM(require_sha512(), 1);
  function rootKdf(rootKey, dhOutput) {
    const output = (0, import_hkdf4.hkdf)(import_sha5124.sha512, dhOutput, rootKey, "SimpleXRootRatchet", 96);
    return [
      new Uint8Array(output.slice(0, 32)),
      // new_root_key
      new Uint8Array(output.slice(32, 64)),
      // chain_key
      new Uint8Array(output.slice(64, 96))
      // next_header_key
    ];
  }
  function chainKdf(chainKey) {
    const output = (0, import_hkdf4.hkdf)(import_sha5124.sha512, chainKey, void 0, "SimpleXChainRatchet", 96);
    return [
      new Uint8Array(output.slice(0, 32)),
      // new_chain_key
      new Uint8Array(output.slice(32, 64)),
      // message_key
      new Uint8Array(output.slice(64, 80)),
      // body_iv (16B)
      new Uint8Array(output.slice(80, 96))
      // header_iv (16B)
    ];
  }
  function unPad(data) {
    const len = data[0] << 8 | data[1];
    return data.slice(2, 2 + len);
  }
  function readWord32BE(data, offset) {
    return (data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3]) >>> 0;
  }
  function concat(...arrays) {
    let len = 0;
    for (const a of arrays) len += a.length;
    const r = new Uint8Array(len);
    let o = 0;
    for (const a of arrays) {
      r.set(a, o);
      o += a.length;
    }
    return r;
  }
  function hex2(data, n = 8) {
    return Array.from(data.slice(0, Math.min(n, data.length))).map((b) => b.toString(16).padStart(2, "0")).join(" ") + (data.length > n ? "..." : "");
  }
  function initRcvRatchet(params, ourDhKey2) {
    return {
      rootKey: params.ratchetKey,
      nhks: params.rcvNextHK,
      // our send NHK = their receive NHK
      nhkr: params.sndHK,
      // our receive NHK = their send HK
      hks: new Uint8Array(32),
      hkr: new Uint8Array(32),
      cks: new Uint8Array(32),
      ckr: new Uint8Array(32),
      dhSelf: ourDhKey2,
      dhPeer: new Uint8Array(56),
      ns: 0,
      nr: 0,
      pn: 0,
      assocData: params.assocData
    };
  }
  function parseEncRatchetMessage(data) {
    let offset = 0;
    let emHeaderLen;
    if (data[0] < 32) {
      emHeaderLen = data[0] << 8 | data[1];
      offset = 2;
    } else {
      emHeaderLen = data[0];
      offset = 1;
    }
    console.log("[DIAG] EncRatchetMessage: headerLen=" + emHeaderLen + ", v" + (offset === 2 ? "3" : "2"));
    const emHeaderRaw = data.slice(offset, offset + emHeaderLen);
    offset += emHeaderLen;
    const emAuthTag = data.slice(offset, offset + 16);
    offset += 16;
    const emBody = data.slice(offset);
    console.log("[DIAG] emHeader=" + emHeaderRaw.length + "B, emAuthTag=" + emAuthTag.length + "B, emBody=" + emBody.length + "B");
    return { emHeaderRaw, emAuthTag, emBody };
  }
  function parseEncMessageHeader(emHeader) {
    let offset = 0;
    const ehVersion = emHeader[offset] << 8 | emHeader[offset + 1];
    offset += 2;
    const ehIV = emHeader.slice(offset, offset + 16);
    offset += 16;
    const ehAuthTag = emHeader.slice(offset, offset + 16);
    offset += 16;
    let ehBodyLen;
    if (ehVersion >= 3) {
      ehBodyLen = emHeader[offset] << 8 | emHeader[offset + 1];
      offset += 2;
    } else {
      ehBodyLen = emHeader[offset];
      offset += 1;
    }
    const ehBody = emHeader.slice(offset, offset + ehBodyLen);
    console.log("[DIAG] ehVersion=" + ehVersion + ", ehBodyLen=" + ehBodyLen + ", ehBody=" + ehBody.length + "B");
    return { ehVersion, ehIV, ehAuthTag, ehBody };
  }
  function parseMsgHeader(paddedHeader) {
    const content = unPad(paddedHeader);
    let offset = 0;
    const msgVersion = content[offset] << 8 | content[offset + 1];
    offset += 2;
    const dhKeyLen = content[offset];
    offset += 1;
    const peerDhSpki = content.slice(offset, offset + dhKeyLen);
    offset += dhKeyLen;
    const peerDhRaw = peerDhSpki.slice(12, 12 + 56);
    if (msgVersion >= 3) {
      const kemMaybe = content[offset];
      offset += 1;
      if (kemMaybe === 49) {
        const kemType = content[offset];
        offset += 1;
        if (kemType === 80) {
          const kLen = content[offset] << 8 | content[offset + 1];
          offset += 2 + kLen;
          console.log("[DIAG] MsgHeader KEM Proposed: skipped " + kLen + "B key");
        } else if (kemType === 65) {
          const ctLen = content[offset] << 8 | content[offset + 1];
          offset += 2 + ctLen;
          const kLen = content[offset] << 8 | content[offset + 1];
          offset += 2 + kLen;
          console.log("[DIAG] MsgHeader KEM Accepted: skipped ct=" + ctLen + "B, key=" + kLen + "B");
        }
      }
    }
    const msgPN = readWord32BE(content, offset);
    offset += 4;
    const msgNs = readWord32BE(content, offset);
    console.log("[DIAG] MsgHeader: version=" + msgVersion + ", peerDH=" + hex2(peerDhRaw) + ", PN=" + msgPN + ", Ns=" + msgNs);
    return { msgVersion, peerDhRaw, msgPN, msgNs };
  }
  function decryptEncConnInfo(state, encConnInfo) {
    const { emHeaderRaw, emAuthTag, emBody } = parseEncRatchetMessage(encConnInfo);
    const { ehVersion, ehIV, ehAuthTag, ehBody } = parseEncMessageHeader(emHeaderRaw);
    console.log("[DIAG] Decrypting header with NHKr: " + hex2(state.nhkr));
    const headerCipherInput = concat(ehBody, ehAuthTag);
    const headerCipher = gcm(state.nhkr, ehIV, state.assocData);
    const decryptedHeader = headerCipher.decrypt(headerCipherInput);
    console.log("[DIAG] Header decrypted: " + decryptedHeader.length + "B");
    const msgHeader = parseMsgHeader(decryptedHeader);
    const dhRecv = x448.scalarMult(state.dhSelf.privateKey, msgHeader.peerDhRaw);
    console.log("[DIAG] AdvanceRatchet dhRecv: " + hex2(dhRecv));
    const [newRK1, ckr, nhkrNew] = rootKdf(state.rootKey, dhRecv);
    console.log("[DIAG] rootKdf recv: newRK=" + hex2(newRK1) + ", ckr=" + hex2(ckr));
    const newDhSelf = generateX448KeyPair();
    const dhSend = x448.scalarMult(newDhSelf.privateKey, msgHeader.peerDhRaw);
    console.log("[DIAG] AdvanceRatchet dhSend: " + hex2(dhSend));
    const [newRK2, cks, nhksNew] = rootKdf(newRK1, dhSend);
    console.log("[DIAG] rootKdf send: newRK=" + hex2(newRK2) + ", cks=" + hex2(cks));
    const [newCKr, messageKey, bodyIV, _headerIV] = chainKdf(ckr);
    console.log("[DIAG] chainKdf: mk=" + hex2(messageKey) + ", bodyIV=" + hex2(bodyIV));
    const bodyAAD = concat(state.assocData, emHeaderRaw);
    console.log("[DIAG] Body AAD: " + bodyAAD.length + "B (assocData " + state.assocData.length + " + emHeader " + emHeaderRaw.length + ")");
    const bodyCipherInput = concat(emBody, emAuthTag);
    const bodyCipher = gcm(messageKey, bodyIV, bodyAAD);
    const decryptedBody = bodyCipher.decrypt(bodyCipherInput);
    console.log("[DIAG] Body decrypted: " + decryptedBody.length + "B");
    const agentMessage = unPad(decryptedBody);
    console.log("[DIAG] AgentMessage: " + agentMessage.length + "B, tag=0x" + agentMessage[0].toString(16));
    const updatedState = {
      rootKey: newRK2,
      ckr: newCKr,
      cks,
      hks: state.nhks,
      hkr: state.nhkr,
      nhks: nhksNew,
      nhkr: nhkrNew,
      dhSelf: newDhSelf,
      dhPeer: msgHeader.peerDhRaw,
      pn: state.ns,
      nr: msgHeader.msgNs + 1,
      ns: 0,
      assocData: state.assocData
    };
    return { agentMessage, updatedState };
  }
  function rcDecrypt(state, encMessage) {
    const { emHeaderRaw, emAuthTag, emBody } = parseEncRatchetMessage(encMessage);
    const { ehVersion, ehIV, ehAuthTag, ehBody } = parseEncMessageHeader(emHeaderRaw);
    let decryptedHeader = null;
    let isAdvanceRatchet = false;
    const headerCipherInput = concat(ehBody, ehAuthTag);
    if (state.hkr.some((b) => b !== 0)) {
      try {
        const headerCipher = gcm(state.hkr, ehIV, state.assocData);
        decryptedHeader = headerCipher.decrypt(headerCipherInput);
        console.log("[DIAG] Ratchet decrypt: SameRatchet mode (header decrypted with HKr)");
      } catch (_) {
      }
    }
    if (!decryptedHeader) {
      const headerCipher = gcm(state.nhkr, ehIV, state.assocData);
      decryptedHeader = headerCipher.decrypt(headerCipherInput);
      isAdvanceRatchet = true;
      console.log("[DIAG] Ratchet decrypt: AdvanceRatchet mode (header decrypted with NHKr)");
    }
    const msgHeader = parseMsgHeader(decryptedHeader);
    let messageKey;
    let bodyIV;
    let updatedState;
    if (isAdvanceRatchet) {
      const dhRecv = x448.scalarMult(state.dhSelf.privateKey, msgHeader.peerDhRaw);
      console.log("[DIAG] AdvanceRatchet dhRecv: " + hex2(dhRecv));
      const [newRK1, ckr, nhkrNew] = rootKdf(state.rootKey, dhRecv);
      const newDhSelf = generateX448KeyPair();
      const dhSend = x448.scalarMult(newDhSelf.privateKey, msgHeader.peerDhRaw);
      console.log("[DIAG] AdvanceRatchet dhSend: " + hex2(dhSend));
      const [newRK2, cks, nhksNew] = rootKdf(newRK1, dhSend);
      let currentCKr = ckr;
      for (let i = 0; i < msgHeader.msgNs; i++) {
        const [nextCKr] = chainKdf(currentCKr);
        currentCKr = nextCKr;
      }
      const [newCKr, mk, bIV, _hIV] = chainKdf(currentCKr);
      messageKey = mk;
      bodyIV = bIV;
      updatedState = {
        rootKey: newRK2,
        ckr: newCKr,
        cks,
        hks: state.nhks,
        hkr: state.nhkr,
        nhks: nhksNew,
        nhkr: nhkrNew,
        dhSelf: newDhSelf,
        dhPeer: msgHeader.peerDhRaw,
        pn: state.ns,
        nr: msgHeader.msgNs + 1,
        ns: 0,
        assocData: state.assocData
      };
    } else {
      let currentCKr = state.ckr;
      for (let i = state.nr; i < msgHeader.msgNs; i++) {
        const [nextCKr] = chainKdf(currentCKr);
        currentCKr = nextCKr;
      }
      const [newCKr, mk, bIV, _hIV] = chainKdf(currentCKr);
      messageKey = mk;
      bodyIV = bIV;
      updatedState = {
        ...state,
        ckr: newCKr,
        nr: msgHeader.msgNs + 1
      };
    }
    console.log("[DIAG] chainKdf: mk=" + hex2(messageKey) + ", bodyIV=" + hex2(bodyIV));
    const bodyAAD = concat(state.assocData, emHeaderRaw);
    console.log("[DIAG] Body AAD: " + bodyAAD.length + "B");
    const bodyCipherInput = concat(emBody, emAuthTag);
    const bodyCipher = gcm(messageKey, bodyIV, bodyAAD);
    const decryptedBody = bodyCipher.decrypt(bodyCipherInput);
    console.log("[DIAG] Body decrypted: " + decryptedBody.length + "B");
    const agentMessage = unPad(decryptedBody);
    console.log("[DIAG] AgentMessage: " + agentMessage.length + "B, tag=0x" + agentMessage[0].toString(16));
    return { agentMessage, updatedState };
  }
  var HEADER_PAD_V3 = 88;
  function pad(data, targetSize) {
    const padded = new Uint8Array(targetSize);
    padded[0] = data.length >> 8 & 255;
    padded[1] = data.length & 255;
    padded.set(data, 2);
    for (let i = 2 + data.length; i < targetSize; i++) {
      padded[i] = 35;
    }
    return padded;
  }
  function writeWord32BE(arr, offset, value) {
    arr[offset] = value >>> 24 & 255;
    arr[offset + 1] = value >>> 16 & 255;
    arr[offset + 2] = value >>> 8 & 255;
    arr[offset + 3] = value & 255;
  }
  function buildMsgHeader(dhPublicKeySPKI, pn, ns) {
    const content = new Uint8Array(80);
    let offset = 0;
    content[offset] = 0;
    content[offset + 1] = 3;
    offset += 2;
    content[offset] = 68;
    offset += 1;
    content.set(dhPublicKeySPKI, offset);
    offset += 68;
    content[offset] = 48;
    offset += 1;
    writeWord32BE(content, offset, pn);
    offset += 4;
    writeWord32BE(content, offset, ns);
    return content;
  }
  function rcEncrypt(state, plaintext, bodyPadSize = 15696) {
    const [newCKs, messageKey, bodyIV, headerIV] = chainKdf(state.cks);
    console.log("[DIAG] rcEncrypt: chainKdf mk=" + hex2(messageKey) + ", bodyIV=" + hex2(bodyIV) + ", headerIV=" + hex2(headerIV));
    const dhPublicKeySPKI = encodeX448PublicKey(state.dhSelf.publicKey);
    const headerContent = buildMsgHeader(dhPublicKeySPKI, state.pn, state.ns);
    const paddedHeader = pad(headerContent, HEADER_PAD_V3);
    console.log("[DIAG] rcEncrypt: MsgHeader " + headerContent.length + "B content, padded to " + paddedHeader.length + "B, PN=" + state.pn + ", Ns=" + state.ns);
    const headerCipher = gcm(state.hks, headerIV, state.assocData);
    const encryptedHeaderWithTag = headerCipher.encrypt(paddedHeader);
    const ehBody = encryptedHeaderWithTag.slice(0, encryptedHeaderWithTag.length - 16);
    const ehAuthTag = encryptedHeaderWithTag.slice(encryptedHeaderWithTag.length - 16);
    const emHeader = new Uint8Array(2 + 16 + 16 + 2 + ehBody.length);
    let offset = 0;
    emHeader[offset] = 0;
    emHeader[offset + 1] = 3;
    offset += 2;
    emHeader.set(headerIV, offset);
    offset += 16;
    emHeader.set(ehAuthTag, offset);
    offset += 16;
    emHeader[offset] = ehBody.length >> 8 & 255;
    emHeader[offset + 1] = ehBody.length & 255;
    offset += 2;
    emHeader.set(ehBody, offset);
    console.log("[DIAG] rcEncrypt: emHeader=" + emHeader.length + "B");
    const paddedBody = pad(plaintext, bodyPadSize);
    const bodyAAD = concat(state.assocData, emHeader);
    const bodyCipher = gcm(messageKey, bodyIV, bodyAAD);
    const encryptedBodyWithTag = bodyCipher.encrypt(paddedBody);
    const emBody = encryptedBodyWithTag.slice(0, encryptedBodyWithTag.length - 16);
    const emAuthTag = encryptedBodyWithTag.slice(encryptedBodyWithTag.length - 16);
    console.log("[DIAG] rcEncrypt: body padded=" + paddedBody.length + "B, encrypted=" + emBody.length + "B");
    const emHeaderLen = emHeader.length;
    const encrypted = new Uint8Array(2 + emHeaderLen + 16 + emBody.length);
    offset = 0;
    encrypted[offset] = emHeaderLen >> 8 & 255;
    encrypted[offset + 1] = emHeaderLen & 255;
    offset += 2;
    encrypted.set(emHeader, offset);
    offset += emHeaderLen;
    encrypted.set(emAuthTag, offset);
    offset += 16;
    encrypted.set(emBody, offset);
    console.log("[DIAG] rcEncrypt: total EncRatchetMessage=" + encrypted.length + "B");
    const updatedState = {
      ...state,
      cks: newCKs,
      ns: state.ns + 1
    };
    return { encrypted, updatedState };
  }

  // src/connection.ts
  var import_sha2563 = __toESM(require_sha256(), 1);
  var import_tweetnacl6 = __toESM(require_nacl_fast(), 1);

  // src/reply-queue.ts
  function toHex2(bytes) {
    let s = "";
    for (const b of bytes) s += (b < 16 ? "0" : "") + b.toString(16);
    return s;
  }
  function readWord16BE(data, offset) {
    const value = data[offset] << 8 | data[offset + 1];
    return { value, newOffset: offset + 2 };
  }
  function readLenPrefixed(data, offset) {
    const len = data[offset];
    offset += 1;
    const value = data.slice(offset, offset + len);
    return { value, newOffset: offset + len };
  }
  function readLenPrefixedString(data, offset) {
    const { value, newOffset } = readLenPrefixed(data, offset);
    let s = "";
    for (const b of value) s += String.fromCharCode(b);
    return { value: s, newOffset };
  }
  function parseSMPServer2(data, offset) {
    const hostCount = data[offset];
    offset += 1;
    console.log("[DIAG] SMPServer: hostCount=" + hostCount);
    const hosts = [];
    for (let i = 0; i < hostCount; i++) {
      const { value: host, newOffset } = readLenPrefixedString(data, offset);
      hosts.push(host);
      offset = newOffset;
      console.log("[DIAG] SMPServer: host[" + i + "]=" + host);
    }
    const { value: port, newOffset: afterPort } = readLenPrefixedString(data, offset);
    offset = afterPort;
    console.log("[DIAG] SMPServer: port=" + port);
    const { value: keyHash, newOffset: afterHash } = readLenPrefixed(data, offset);
    offset = afterHash;
    console.log("[DIAG] SMPServer: keyHash=" + keyHash.length + "B");
    return { hosts, port, keyHash, newOffset: offset };
  }
  function parseSMPQueueInfo(data, offset) {
    const { value: clientVersion, newOffset: afterVersion } = readWord16BE(data, offset);
    offset = afterVersion;
    console.log("[DIAG] SMPQueueInfo: clientVersion=" + clientVersion);
    const server = parseSMPServer2(data, offset);
    offset = server.newOffset;
    const { value: senderId, newOffset: afterSenderId } = readLenPrefixed(data, offset);
    offset = afterSenderId;
    console.log("[DIAG] SMPQueueInfo: senderId=" + senderId.length + "B (" + toHex2(senderId) + ")");
    const { value: dhPublicKeySpki, newOffset: afterDhKey } = readLenPrefixed(data, offset);
    offset = afterDhKey;
    const dhPublicKeyRaw = dhPublicKeySpki.length === 44 ? dhPublicKeySpki.slice(12) : dhPublicKeySpki;
    console.log("[DIAG] SMPQueueInfo: dhPublicKey=" + dhPublicKeySpki.length + "B SPKI, " + dhPublicKeyRaw.length + "B raw");
    const sndSecureByte = data[offset];
    offset += 1;
    const sndSecure = sndSecureByte === 84;
    console.log("[DIAG] SMPQueueInfo: sndSecure=" + sndSecure + " (0x" + sndSecureByte.toString(16) + ")");
    return {
      queue: {
        clientVersion,
        serverHosts: server.hosts,
        serverPort: server.port,
        keyHash: server.keyHash,
        senderId,
        dhPublicKeySpki,
        dhPublicKeyRaw,
        sndSecure
      },
      newOffset: offset
    };
  }
  function parseAgentConnInfoReply(data) {
    let offset = 0;
    const tag = data[offset];
    offset += 1;
    if (tag !== 68) {
      throw new Error("Expected AgentConnInfoReply tag 'D' (0x44), got 0x" + tag.toString(16));
    }
    const queueCount = data[offset];
    offset += 1;
    console.log("[DIAG] AgentConnInfoReply: queueCount=" + queueCount);
    const queues = [];
    for (let i = 0; i < queueCount; i++) {
      console.log("[DIAG] Parsing queue " + (i + 1) + "/" + queueCount + " at offset " + offset);
      const { queue, newOffset } = parseSMPQueueInfo(data, offset);
      queues.push(queue);
      offset = newOffset;
    }
    const connInfo = data.slice(offset);
    console.log("[DIAG] AgentConnInfoReply: connInfo=" + connInfo.length + "B at offset " + offset);
    try {
      const text = new TextDecoder().decode(connInfo);
      const jsonStart = text.indexOf("{");
      if (jsonStart >= 0) {
        console.log("[DIAG] ConnInfo JSON: " + text.substring(jsonStart, jsonStart + 200));
      }
    } catch (_) {
    }
    return { queues, connInfo };
  }

  // src/connection.ts
  function toHex3(bytes) {
    let s = "";
    for (const b of bytes) s += (b < 16 ? "0" : "") + b.toString(16);
    return s;
  }
  function serverToString(server) {
    return server.hosts[0] + ":" + server.port;
  }
  function toSMPServerAddress(server) {
    const keyHash = base64urlDecode(server.serverIdentity);
    if (keyHash.length === 0) {
      return { host: server.hosts[0], port: server.port, keyHash: new Uint8Array(32) };
    }
    return {
      host: server.hosts[0],
      port: server.port,
      keyHash
    };
  }
  function base64urlDecode(s) {
    if (!s || s.length === 0) return new Uint8Array(0);
    let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function extractContactQueue(queue) {
    return {
      server: {
        hosts: queue.server.hosts,
        port: queue.server.port,
        serverIdentity: queue.server.serverIdentity
      },
      senderId: queue.senderId,
      dhPublicKey: queue.dhPublicKey,
      smpVersion: queue.smpVersion,
      sndSecure: queue.sndSecure
    };
  }
  var ConnectionManager = class {
    constructor(agent, config) {
      __publicField(this, "agent");
      __publicField(this, "config");
      __publicField(this, "connections", /* @__PURE__ */ new Map());
      // --- Shared send infrastructure ---
      __publicField(this, "X25519_SPKI_PREFIX", new Uint8Array([48, 42, 48, 5, 6, 3, 43, 101, 110, 3, 33, 0]));
      this.agent = agent;
      this.config = config ?? {};
    }
    async initiateConnection(contactAddressUri) {
      console.log("[SMP] initiateConnection: parsing contact address");
      const contactAddress = parseContactAddress(contactAddressUri);
      console.log("[SMP] initiateConnection: format=" + contactAddress.format);
      const state = new ConnectionStateMachine();
      console.log("[SMP] initiateConnection: generating key pairs");
      const keys = {
        recipientAuth: generateX25519KeyPair(),
        // X25519 for v7+ CbAuthenticator
        recipientDh: generateX25519KeyPair(),
        e2eDh: generateX25519KeyPair()
      };
      let contactQueue = null;
      if (contactAddress.format === "full") {
        contactQueue = extractContactQueue(contactAddress.data.smpQueues[0]);
      }
      const targetServer = this.resolveTargetServer(contactAddress);
      console.log("[SMP] initiateConnection: target server=" + targetServer.hosts[0] + ":" + targetServer.port + ", identity=" + (targetServer.serverIdentity ? targetServer.serverIdentity.substring(0, 12) + "..." : "(empty)"));
      const conn = {
        state,
        keys,
        contactAddress,
        contactQueue,
        receiveQueue: null,
        queueDhPrivateKey: null,
        e2eKey1: null,
        e2eKey2: null,
        ratchetState: null,
        e2eDhPubKey: null,
        msgCount: 0,
        replyQueue: null,
        handshakeSent: false,
        replyE2eKeyPair: null,
        replySenderAuthPrivKey: null,
        onChatMessage: null,
        onDeliveryReceipt: null,
        onConnectionEnded: null,
        sndMsgId: 1,
        prevMsgHash: new Uint8Array(0)
      };
      try {
        const serverAddress = toSMPServerAddress(targetServer);
        console.log("[SMP] initiateConnection: keyHash=" + serverAddress.keyHash.length + "B, first 4 bytes: " + Array.from(serverAddress.keyHash.subarray(0, 4)).map((b) => b.toString(16).padStart(2, "0")).join(" "));
        console.log("[SMP] initiateConnection: calling agent.getClient");
        const client = await this.agent.getClient(serverAddress);
        console.log("[SMP] initiateConnection: agent.getClient returned, calling createQueue");
        const ids = await client.createQueue({
          recipientAuthKey: encodeX25519PublicKey(keys.recipientAuth.publicKey),
          // X25519 SPKI for v7+ CbAuth
          recipientAuthPrivateKey: keys.recipientAuth.privateKey,
          // X25519 private key for CbAuthenticator
          recipientDhKey: encodeX25519PublicKey(keys.recipientDh.publicKey),
          subscribeMode: this.config.subscribeMode ?? "S",
          sndSecure: this.config.sndSecure ?? true
        });
        console.log("[SMP] initiateConnection: createQueue returned IDS, recipientId=" + ids.recipientId.length + "B");
        conn.receiveQueue = {
          recipientId: ids.recipientId,
          senderId: ids.senderId,
          serverDhKey: ids.serverDhKey
        };
        state.transition("createQueues");
        const queuePair = {
          receiveQueue: {
            server: serverToString(targetServer),
            recipientId: toHex3(ids.recipientId),
            senderId: toHex3(ids.senderId)
          },
          sendQueue: {
            server: contactQueue ? serverToString(contactQueue.server) : serverToString(targetServer),
            senderId: contactQueue ? contactQueue.senderId : ""
          }
        };
        state.setQueuePair(queuePair);
      } catch (err) {
        state.transition("error", {
          code: "QUEUE_CREATION_FAILED",
          message: err instanceof Error ? err.message : "Unknown error",
          cause: err instanceof Error ? err : void 0
        });
        this.connections.set(state.id, conn);
        throw err;
      }
      this.connections.set(state.id, conn);
      return conn;
    }
    getConnection(connectionId) {
      return this.connections.get(connectionId);
    }
    getActiveConnections() {
      const active = [];
      for (const conn of this.connections.values()) {
        if (!conn.state.isTerminal) {
          active.push(conn);
        }
      }
      return active;
    }
    /**
     * Send a connection request on an existing managed connection.
     * The connection must be in QUEUE_CREATED state with a non-null contactQueue.
     *
     * Steps:
     * 1. Build the full connection request (6 crypto layers)
     * 2. Get SMP client for Alice's contact queue server
     * 3. Send SKEY to secure sender on contact queue (Fast SMP v9)
     * 4. Send SEND to contact queue with the confirmation
     * 5. Drive state machine to PENDING
     */
    async sendConnectionRequest(connectionId, params, aliceKey1Raw, aliceKey2Raw) {
      const conn = this.connections.get(connectionId);
      if (!conn) throw new Error("Connection not found: " + connectionId);
      if (conn.state.state !== "QUEUE_CREATED") {
        throw new Error("Connection must be in QUEUE_CREATED state, got: " + conn.state.state);
      }
      if (!conn.contactQueue) {
        throw new Error("Cannot send connection request: contactQueue is null (short link not resolved)");
      }
      try {
        const { smpEncConfirmation, senderAuthKeySPKI } = await buildConnectionRequest(
          conn,
          params,
          aliceKey1Raw,
          aliceKey2Raw
        );
        const contactServer = toSMPServerAddress(conn.contactQueue.server);
        const client = await this.agent.getClient(contactServer);
        const senderIdBytes = base64urlDecode(conn.contactQueue.senderId);
        await client.secureQueueSender(senderIdBytes, senderAuthKeySPKI);
        await client.sendMessage(senderIdBytes, {
          notification: true,
          encMessage: smpEncConfirmation
        });
        conn.state.transition("sendRequest");
      } catch (err) {
        conn.state.transition("error", {
          code: "REQUEST_SEND_FAILED",
          message: err instanceof Error ? err.message : "Unknown error",
          cause: err instanceof Error ? err : void 0
        });
        throw err;
      }
    }
    /**
     * Send a connection invitation to the contact queue (Step 2).
     * Simpler than sendConnectionRequest - no X3DH/Double Ratchet needed.
     * Uses NaCl Layer 1 encryption only.
     *
     * The connection must be in QUEUE_CREATED state with a non-null contactQueue.
     * After success, state transitions to PENDING.
     */
    async sendInvitation(connectionId, displayName) {
      const conn = this.connections.get(connectionId);
      if (!conn) throw new Error("Connection not found: " + connectionId);
      if (conn.state.state !== "QUEUE_CREATED") {
        throw new Error("Connection must be in QUEUE_CREATED state, got: " + conn.state.state);
      }
      if (!conn.contactQueue) {
        throw new Error("Cannot send invitation: contactQueue is null (short link not resolved)");
      }
      try {
        console.log("[SMP] sendInvitation: building invitation for '" + displayName + "'");
        const { smpEncConfirmation, queueDhKeyPair, ratchetKeyPair, ephemeralKeyPair } = await buildInvitation(conn, displayName, 6);
        conn.queueDhPrivateKey = queueDhKeyPair.privateKey;
        conn.e2eKey1 = ratchetKeyPair;
        conn.e2eKey2 = ephemeralKeyPair;
        const contactServer = toSMPServerAddress({
          hosts: conn.contactQueue.server.hosts,
          port: conn.contactQueue.server.port,
          serverIdentity: conn.contactQueue.server.serverIdentity
        });
        let serverForConnection = contactServer;
        if (this.config.queueServer) {
          serverForConnection = toSMPServerAddress({
            hosts: this.config.queueServer.hosts,
            port: this.config.queueServer.port,
            serverIdentity: conn.contactQueue.server.serverIdentity
          });
        }
        console.log("[SMP] sendInvitation: connecting to contact queue server " + serverForConnection.host + ":" + serverForConnection.port);
        const client = await this.agent.getClient(serverForConnection);
        const contactSenderIdBytes = base64urlDecode(conn.contactQueue.senderId);
        console.log("[SMP] sendInvitation: entityId (contact senderId) = " + toHex3(contactSenderIdBytes) + " (" + contactSenderIdBytes.length + "B)");
        console.log("[SMP] sendInvitation: smpEncConfirmation=" + smpEncConfirmation.length + "B, first 8:", Array.from(smpEncConfirmation.subarray(0, 8)).map((b) => b.toString(16).padStart(2, "0")).join(" "));
        if (smpEncConfirmation.length < 100) {
          console.log("[SMP] sendInvitation: WARNING - encMessage too small! Expected ~16008B, got " + smpEncConfirmation.length + "B");
        }
        console.log("[SMP] sendInvitation: calling client.sendMessage with " + smpEncConfirmation.length + "B body");
        await client.sendMessage(contactSenderIdBytes, {
          notification: false,
          encMessage: smpEncConfirmation
        });
        console.log("[SMP] sendInvitation: SEND accepted by server (OK)");
        conn.state.transition("sendRequest");
        console.log("[SMP] sendInvitation: state -> PENDING");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.log("[SMP] sendInvitation: FAILED: " + msg);
        conn.state.transition("error", {
          code: "REQUEST_SEND_FAILED",
          message: msg,
          cause: err instanceof Error ? err : void 0
        });
        throw err;
      }
    }
    /**
     * Set up MSG handler for a connection. Decrypts incoming MSG bodies
     * using the server DH key and recipient DH private key, parses the
     * RcvMsgBody, and sends ACK.
     *
     * @param connectionId - ID of the managed connection
     * @param onMsgBody - callback with the decrypted SEND body (smpEncConfirmation)
     */
    async setupMsgHandler(connectionId, onMsgBody) {
      const conn = this.connections.get(connectionId);
      if (!conn || !conn.receiveQueue) return;
      const targetServer = this.resolveTargetServer(conn.contactAddress);
      let serverForConnection = toSMPServerAddress(targetServer);
      if (this.config.queueServer) {
        serverForConnection = toSMPServerAddress({
          hosts: this.config.queueServer.hosts,
          port: this.config.queueServer.port,
          serverIdentity: targetServer.serverIdentity
        });
      }
      const client = await this.agent.getClient(serverForConnection);
      const serverDhRaw = extractRawX25519(conn.receiveQueue.serverDhKey);
      const recipientDhPriv = conn.keys.recipientDh.privateKey;
      const recipientAuthPriv = conn.keys.recipientAuth.privateKey;
      const layer1DhPriv = conn.queueDhPrivateKey || conn.keys.recipientDh.privateKey;
      const recipientId = conn.receiveQueue.recipientId;
      client.onMessage((entityId, msgId, encBody) => {
        conn.msgCount++;
        const msgNum = conn.msgCount;
        console.log("[SMP] MSG #" + msgNum + " received: msgId=" + msgId.length + "B, encBody=" + encBody.length + "B");
        const decrypted = decryptMsgBody(encBody, msgId, serverDhRaw, recipientDhPriv);
        if (!decrypted) {
          console.log("[SMP] MSG server decryption FAILED");
          return;
        }
        console.log("[SMP] MSG server-decrypted: " + decrypted.length + "B");
        const msg = parseRcvMsgBody(decrypted);
        console.log("[SMP] MSG parsed: msgBody=" + msg.msgBody.length + "B, flags=" + msg.msgFlags);
        try {
          const envelope = parseSmpEncConfirmation(msg.msgBody);
          const hasNewKey = envelope.aliceDhPublicKeyRaw !== null;
          console.log("[SMP] Layer1: e2ePubKey=" + (hasNewKey ? envelope.aliceDhPublicKeyRaw.length + "B" : "Nothing (reuse stored)") + ", encBody=" + envelope.encryptedBody.length + "B");
          if (hasNewKey && !conn.e2eDhPubKey) {
            conn.e2eDhPubKey = new Uint8Array(envelope.aliceDhPublicKeyRaw);
            console.log("[SMP] Stored e2eDhPubKey for subsequent messages");
          }
          const l1Decrypted = decryptLayer1(envelope, layer1DhPriv, conn.e2eDhPubKey ?? void 0);
          if (!l1Decrypted) {
            console.log("[SMP] Layer1 decryption FAILED");
            onMsgBody(msg.msgBody);
            return;
          }
          console.log("[SMP] Layer1 decrypted: " + l1Decrypted.length + "B");
          const confirmation = parseSmpConfirmation(l1Decrypted);
          console.log("[SMP] smpConfirmation: senderKey=" + (confirmation.senderAuthKeySPKI ? confirmation.senderAuthKeySPKI.length + "B" : "none") + ", body=" + confirmation.agentConfirmation.length + "B");
          const innerBody = confirmation.agentConfirmation;
          if (msgNum === 1) {
            this.handleAgentConfirmation(conn, innerBody, onMsgBody, msg.msgBody);
          } else {
            this.handleAgentMsgEnvelope(conn, innerBody, msgNum, onMsgBody, msg.msgBody);
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          console.log("[SMP] Layer1 parse/decrypt error: " + errMsg);
          onMsgBody(msg.msgBody);
        }
        client.acknowledge(recipientId, msgId, recipientAuthPriv).then(() => {
          console.log("[SMP] ACK sent for msgId");
        }).catch((err) => {
          console.log("[SMP] ACK failed: " + err.message);
        });
      });
      client.onSubscriptionEnd((_entityId) => {
        console.log("[SMP] Queue subscription ended (agent deleted contact)");
        if (conn.onConnectionEnded) {
          conn.onConnectionEnded();
        }
      });
    }
    /**
     * Handle the first MSG: AgentConfirmation with X3DH + Ratchet decrypt.
     */
    handleAgentConfirmation(conn, innerBody, onMsgBody, rawMsgBody) {
      console.log("[SMP] AgentConfirmation first 10B:", Array.from(innerBody.subarray(0, Math.min(10, innerBody.length))).map((b) => b.toString(16).padStart(2, "0")).join(" "));
      try {
        const parsed = parseAgentConfirmation(innerBody);
        console.log("[SMP] AgentConfirmation parsed: agentVersion=" + parsed.agentVersion + ", e2eVersion=" + parsed.e2eEncryption.e2eVersion + ", encConnInfo=" + parsed.encConnInfo.length + "B");
        if (!conn.e2eKey1 || !conn.e2eKey2) {
          console.log("[SMP] X3DH skipped: e2eKey1/e2eKey2 not stored on connection");
          onMsgBody(rawMsgBody);
          return;
        }
        const initParams = x3dhReceiver(
          conn.e2eKey1,
          conn.e2eKey2,
          parsed.e2eEncryption.key1Raw,
          parsed.e2eEncryption.key2Raw
        );
        console.log("[SMP] X3DH complete: ratchetKey=" + initParams.ratchetKey.length + "B, sndHK=" + initParams.sndHK.length + "B, rcvNextHK=" + initParams.rcvNextHK.length + "B, assocData=" + initParams.assocData.length + "B");
        const ratchetState = initRcvRatchet(initParams, conn.e2eKey2);
        const { agentMessage, updatedState } = decryptEncConnInfo(ratchetState, parsed.encConnInfo);
        console.log("[SMP] encConnInfo decrypted! AgentMessage tag=0x" + agentMessage[0].toString(16) + ", length=" + agentMessage.length + "B");
        conn.ratchetState = updatedState;
        console.log("[SMP] Ratchet state saved (nr=" + updatedState.nr + ")");
        if (agentMessage[0] === 68) {
          try {
            const reply = parseAgentConnInfoReply(agentMessage);
            if (reply.queues.length > 0) {
              conn.replyQueue = reply.queues[0];
              console.log("[SMP] Reply queue: " + reply.queues[0].serverHosts.join(",") + ":" + reply.queues[0].serverPort + ", senderId=" + reply.queues[0].senderId.length + "B, dhKey=" + reply.queues[0].dhPublicKeyRaw.length + "B, sndSecure=" + reply.queues[0].sndSecure);
            }
            try {
              const text = new TextDecoder().decode(reply.connInfo);
              const jsonStart = text.indexOf("{");
              if (jsonStart >= 0) {
                console.log("[SMP] ConnInfo JSON: " + text.substring(jsonStart, jsonStart + 200));
              }
            } catch (_) {
            }
          } catch (parseErr) {
            console.log("[SMP] AgentConnInfoReply parse error: " + (parseErr instanceof Error ? parseErr.message : String(parseErr)));
            try {
              const text = new TextDecoder().decode(agentMessage);
              const jsonStart = text.indexOf("{");
              if (jsonStart >= 0) {
                console.log("[SMP] ConnInfo JSON (fallback): " + text.substring(jsonStart, jsonStart + 200));
              }
            } catch (_) {
            }
          }
        } else {
          console.log("[SMP] AgentMessage tag=0x" + agentMessage[0].toString(16) + " (expected 'D'=0x44)");
        }
        if (conn.replyQueue && !conn.handshakeSent) {
          const connId = conn.state.id;
          console.log("[SMP] Auto-sending handshake reply to CLI's reply queue...");
          this.sendHandshake(connId, "GoChat User").then(() => {
            console.log("[SMP] Handshake reply sent successfully!");
          }).catch((err) => {
            console.log("[SMP] Handshake reply FAILED: " + err.message);
          });
        }
        onMsgBody(rawMsgBody);
      } catch (err) {
        console.log("[SMP] AgentConfirmation parse/X3DH/Ratchet error: " + (err instanceof Error ? err.message : String(err)));
        onMsgBody(rawMsgBody);
      }
    }
    /**
     * Handle subsequent MSGs: AgentMsgEnvelope (tag 'M') with ratchet decrypt.
     * Parses the outer AgentMsgEnvelope, ratchet-decrypts the inner message,
     * and identifies the AgentMessage type (HELLO, etc.).
     */
    handleAgentMsgEnvelope(conn, innerBody, msgNum, onMsgBody, rawMsgBody) {
      let offset = 0;
      const agentVersion = innerBody[offset] << 8 | innerBody[offset + 1];
      offset += 2;
      const envTag = innerBody[offset];
      offset += 1;
      const envTagChar = String.fromCharCode(envTag);
      console.log("[SMP] MSG #" + msgNum + " AgentMsgEnvelope: agentVersion=" + agentVersion + ", tag='" + envTagChar + "' (0x" + envTag.toString(16) + ")");
      if (envTag !== 77) {
        console.log("[SMP] MSG #" + msgNum + ": unexpected envelope tag '" + envTagChar + "', expected 'M'");
        onMsgBody(rawMsgBody);
        return;
      }
      const encAgentMessage = innerBody.subarray(offset);
      console.log("[SMP] encAgentMessage: " + encAgentMessage.length + "B");
      if (!conn.ratchetState) {
        console.log("[SMP] MSG #" + msgNum + ": no ratchet state available (AgentConfirmation not yet processed)");
        onMsgBody(rawMsgBody);
        return;
      }
      try {
        const { agentMessage, updatedState } = rcDecrypt(conn.ratchetState, encAgentMessage);
        conn.ratchetState = updatedState;
        console.log("[SMP] MSG #" + msgNum + " ratchet decrypted: " + agentMessage.length + "B, ratchet nr=" + updatedState.nr);
        const amTag = agentMessage[0];
        const amTagChar = String.fromCharCode(amTag);
        console.log("[SMP] AgentMessage tag='" + amTagChar + "' (0x" + amTag.toString(16) + ")");
        if (amTag === 77) {
          this.parseAgentMessageContent(conn, agentMessage, msgNum);
        } else {
          console.log("[SMP] MSG #" + msgNum + ": AgentMessage tag '" + amTagChar + "' - not A_MSG");
        }
        onMsgBody(rawMsgBody);
      } catch (err) {
        console.log("[SMP] MSG #" + msgNum + " ratchet decrypt error: " + (err instanceof Error ? err.message : String(err)));
        onMsgBody(rawMsgBody);
      }
    }
    /**
     * Parse AgentMessage content to identify HELLO and other message types.
     * AgentMessage = tag + APrivHeader + AMessage
     *
     * A_MSG ('M'): [1B 'M'][APrivHeader][AMessage]
     * APrivHeader: [Word16 prevMsgHash length][hash bytes]
     * AMessage: HELLO = 'H', A_MSG = 'M', ...
     */
    parseAgentMessageContent(conn, agentMessage, msgNum) {
      let offset = 1;
      const incomingSndMsgId = this.readInt64BE(agentMessage, offset);
      offset += 8;
      const hashLen = agentMessage[offset];
      offset += 1;
      offset += hashLen;
      console.log("[DIAG] APrivHeader: sndMsgId=" + incomingSndMsgId + ", prevMsgHash=" + hashLen + "B, remaining=" + (agentMessage.length - offset) + "B");
      if (offset < agentMessage.length) {
        const innerTag = agentMessage[offset];
        const innerTagChar = String.fromCharCode(innerTag);
        console.log("[DIAG] AMessage tag='" + innerTagChar + "' (0x" + innerTag.toString(16) + ")");
        if (innerTag === 72) {
          console.log("[SMP] HELLO received! Connection established.");
          try {
            if (conn.state.state === "PENDING") {
              conn.state.transition("receiveConfirmation");
            }
            if (conn.state.state === "CONFIRMED") {
              conn.state.transition("acknowledgeConfirmation");
            }
            console.log("[SMP] State -> " + conn.state.state);
          } catch (_) {
            console.log("[SMP] State transition skipped (state=" + conn.state.state + ")");
          }
          if (conn.replyQueue && conn.handshakeSent) {
            const connId = conn.state.id;
            console.log("[SMP] Auto-sending HELLO to CLI...");
            this.sendHello(connId).then(() => {
              console.log("[SMP] HELLO sent to CLI!");
            }).catch((err) => {
              console.log("[SMP] HELLO send failed (non-fatal): " + err.message);
            });
          }
        } else if (innerTag === 77) {
          const msgBody = agentMessage.slice(offset + 1);
          try {
            const msgText = new TextDecoder().decode(msgBody);
            console.log("[SMP] MSG #" + msgNum + " chat: " + msgText);
            try {
              const parsed = JSON.parse(msgText);
              if (parsed.event === "x.msg.new" && parsed.params?.content?.text) {
                const chatText = parsed.params.content.text;
                console.log("[SMP] Chat message text: " + chatText);
                if (conn.onChatMessage) {
                  conn.onChatMessage(chatText);
                }
                if (conn.replyQueue && conn.handshakeSent && conn.state.state === "CONNECTED") {
                  const msgHash = new Uint8Array((0, import_sha2563.sha256)(agentMessage));
                  this.sendReceipt(conn.state.id, incomingSndMsgId, msgHash).catch((err) => {
                    console.log("[SMP] Receipt send failed (non-fatal): " + err.message);
                  });
                }
              } else if (conn.onChatMessage) {
                conn.onChatMessage(msgText);
              }
            } catch {
              if (conn.onChatMessage) {
                conn.onChatMessage(msgText);
              }
            }
          } catch {
            console.log("[SMP] MSG #" + msgNum + ": chat message received (" + msgBody.length + "B binary)");
          }
        } else if (innerTag === 86) {
          this.parseDeliveryReceipt(conn, agentMessage, offset + 1, msgNum);
        } else {
          console.log("[SMP] MSG #" + msgNum + ": AMessage tag '" + innerTagChar + "'");
        }
      }
    }
    // --- Delivery receipts ---
    /**
     * Read an Int64 BE value from a Uint8Array. Returns as Number (safe for sndMsgId counters).
     */
    readInt64BE(data, offset) {
      const hi = (data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3]) >>> 0;
      const lo = (data[offset + 4] << 24 | data[offset + 5] << 16 | data[offset + 6] << 8 | data[offset + 7]) >>> 0;
      return hi * 4294967296 + lo;
    }
    /**
     * Parse incoming A_RCVD delivery receipts (inner_tag 'V').
     * Each receipt references the agentMsgId of a message we sent.
     */
    parseDeliveryReceipt(conn, data, offset, msgNum) {
      const count = data[offset];
      offset += 1;
      console.log("[SMP] MSG #" + msgNum + " delivery receipt: " + count + " receipt(s)");
      for (let i = 0; i < count; i++) {
        if (offset + 8 > data.length) break;
        const agentMsgId = this.readInt64BE(data, offset);
        offset += 8;
        const rcptHashLen = data[offset];
        offset += 1 + rcptHashLen;
        offset += 2;
        console.log("[SMP] Receipt " + (i + 1) + "/" + count + ": agentMsgId=" + agentMsgId);
        if (conn.onDeliveryReceipt) {
          conn.onDeliveryReceipt(agentMsgId);
        }
      }
    }
    /**
     * Send a delivery receipt (A_RCVD) for a received chat message.
     * Uses the same sendEncrypted pipeline as chat messages.
     *
     * @param connectionId - Connection ID
     * @param receivedMsgId - sndMsgId from the received message's APrivHeader
     * @param msgHash - SHA256 of the received message body
     */
    async sendReceipt(connectionId, receivedMsgId, msgHash) {
      const conn = this.connections.get(connectionId);
      if (!conn) return;
      console.log("[SMP] sendReceipt: receipt for msgId=" + receivedMsgId);
      const privHeader = this.buildAPrivHeader(conn);
      const receiptPayload = new Uint8Array(1 + 8 + 1 + msgHash.length + 2);
      let rOffset = 0;
      receiptPayload[rOffset++] = 1;
      receiptPayload[rOffset++] = 0;
      receiptPayload[rOffset++] = 0;
      receiptPayload[rOffset++] = 0;
      receiptPayload[rOffset++] = 0;
      receiptPayload[rOffset++] = receivedMsgId >>> 24 & 255;
      receiptPayload[rOffset++] = receivedMsgId >>> 16 & 255;
      receiptPayload[rOffset++] = receivedMsgId >>> 8 & 255;
      receiptPayload[rOffset++] = receivedMsgId & 255;
      receiptPayload[rOffset++] = msgHash.length;
      receiptPayload.set(msgHash, rOffset);
      rOffset += msgHash.length;
      receiptPayload[rOffset++] = 0;
      receiptPayload[rOffset++] = 0;
      const agentMessage = new Uint8Array(1 + privHeader.length + 1 + receiptPayload.length);
      agentMessage[0] = 77;
      agentMessage.set(privHeader, 1);
      agentMessage[1 + privHeader.length] = 86;
      agentMessage.set(receiptPayload, 2 + privHeader.length);
      await this.sendEncrypted(
        conn,
        agentMessage,
        1,
        // agentVersion = 1 (NOT 7!)
        77,
        // 'M' = AgentMsgEnvelope
        null,
        false,
        // subsequent message
        (envelope) => {
          const smpConf = new Uint8Array(1 + envelope.length);
          smpConf[0] = 95;
          smpConf.set(envelope, 1);
          return smpConf;
        }
      );
      console.log("[SMP] sendReceipt: sent for msgId=" + receivedMsgId);
    }
    /**
     * Build APrivHeader: [Word32 sndMsgId][1B prevMsgHash length][prevMsgHash bytes]
     */
    buildAPrivHeader(conn) {
      const hashLen = conn.prevMsgHash.length;
      const header = new Uint8Array(8 + 1 + hashLen);
      let offset = 0;
      header[offset++] = 0;
      header[offset++] = 0;
      header[offset++] = 0;
      header[offset++] = 0;
      header[offset++] = conn.sndMsgId >>> 24 & 255;
      header[offset++] = conn.sndMsgId >>> 16 & 255;
      header[offset++] = conn.sndMsgId >>> 8 & 255;
      header[offset++] = conn.sndMsgId & 255;
      header[offset++] = hashLen;
      if (hashLen > 0) header.set(conn.prevMsgHash, offset);
      return header;
    }
    /**
     * Shared send pipeline for messages to CLI's reply queue.
     *
     * Handles: rcEncrypt, envelope wrapping, NaCl per-queue encrypt, SEND.
     *
     * @param conn - Managed connection with ratchet state and reply queue
     * @param plaintext - AgentMessage plaintext (will be ratchet-encrypted)
     * @param agentVersion - 7 for AgentConfirmation, 1 for AgentMsgEnvelope
     * @param envelopeTag - 0x43 ('C') for confirmation, 0x4D ('M') for messages
     * @param extraEnvelopeBytes - extra bytes after tag (e.g. Maybe e2e Nothing '0' for 'C')
     * @param isFirstMessage - true = e2ePubKey=Just + pad 15904, false = Nothing + pad 15840
     * @param smpConfBuilder - builds smpConfirmation from the envelope bytes
     */
    async sendEncrypted(conn, plaintext, agentVersion, envelopeTag, extraEnvelopeBytes, isFirstMessage, smpConfBuilder) {
      if (!conn.replyQueue) throw new Error("No reply queue available");
      if (!conn.ratchetState) throw new Error("No ratchet state available");
      const envelopeOverhead = 2 + 1 + (extraEnvelopeBytes ? extraEnvelopeBytes.length : 0);
      const dummySmpConf = smpConfBuilder(new Uint8Array(0));
      const smpConfOverhead = dummySmpConf.length;
      const naclPadTarget = isFirstMessage ? 15904 : 15840;
      const encRatchetOverhead = 142;
      const bodyPadSize = naclPadTarget - 2 - smpConfOverhead - envelopeOverhead - encRatchetOverhead;
      console.log("[SMP] sendEncrypted: bodyPadSize=" + bodyPadSize + " (naclPad=" + naclPadTarget + ", smpConfOH=" + smpConfOverhead + ", envOH=" + envelopeOverhead + ")");
      const { encrypted: encRatchetMessage, updatedState } = rcEncrypt(conn.ratchetState, plaintext, bodyPadSize);
      conn.ratchetState = updatedState;
      console.log("[SMP] sendEncrypted: ratchet encrypted=" + encRatchetMessage.length + "B, ns=" + updatedState.ns);
      const extraLen = extraEnvelopeBytes ? extraEnvelopeBytes.length : 0;
      const envelope = new Uint8Array(2 + 1 + extraLen + encRatchetMessage.length);
      envelope[0] = agentVersion >> 8 & 255;
      envelope[1] = agentVersion & 255;
      envelope[2] = envelopeTag;
      if (extraEnvelopeBytes) envelope.set(extraEnvelopeBytes, 3);
      envelope.set(encRatchetMessage, 3 + extraLen);
      console.log("[SMP] sendEncrypted: envelope=" + envelope.length + "B (v=" + agentVersion + ", tag=0x" + envelopeTag.toString(16) + ")");
      const smpConfirmation = smpConfBuilder(envelope);
      const replyDhPubRaw = conn.replyQueue.dhPublicKeyRaw;
      if (isFirstMessage) {
        const senderE2eKeyPair = import_tweetnacl6.default.box.keyPair();
        conn.replyE2eKeyPair = senderE2eKeyPair;
        const paddedSmpConf = pad(smpConfirmation, 15904);
        const nonce = import_tweetnacl6.default.randomBytes(24);
        const encryptedBody = import_tweetnacl6.default.box(paddedSmpConf, nonce, replyDhPubRaw, senderE2eKeyPair.secretKey);
        const senderDhSpki = new Uint8Array(44);
        senderDhSpki.set(this.X25519_SPKI_PREFIX);
        senderDhSpki.set(senderE2eKeyPair.publicKey, 12);
        const sendBody = new Uint8Array(2 + 1 + 1 + 44 + 24 + encryptedBody.length);
        let offset = 0;
        sendBody[offset++] = 0;
        sendBody[offset++] = 4;
        sendBody[offset++] = 49;
        sendBody[offset++] = 44;
        sendBody.set(senderDhSpki, offset);
        offset += 44;
        sendBody.set(nonce, offset);
        offset += 24;
        sendBody.set(encryptedBody, offset);
        await this.sendToReplyQueue(conn, sendBody);
      } else {
        if (!conn.replyE2eKeyPair) throw new Error("No E2E keypair for reply queue (handshake not sent?)");
        const paddedSmpConf = pad(smpConfirmation, 15840);
        const nonce = import_tweetnacl6.default.randomBytes(24);
        const encryptedBody = import_tweetnacl6.default.box(paddedSmpConf, nonce, replyDhPubRaw, conn.replyE2eKeyPair.secretKey);
        const sendBody = new Uint8Array(2 + 1 + 24 + encryptedBody.length);
        let offset = 0;
        sendBody[offset++] = 0;
        sendBody[offset++] = 4;
        sendBody[offset++] = 48;
        sendBody.set(nonce, offset);
        offset += 24;
        sendBody.set(encryptedBody, offset);
        await this.sendToReplyQueue(conn, sendBody);
      }
      conn.prevMsgHash = new Uint8Array((0, import_sha2563.sha256)(plaintext));
      conn.sndMsgId++;
    }
    /**
     * Send bytes to the CLI's reply queue via SMP SEND.
     */
    async sendToReplyQueue(conn, sendBody) {
      const signed = conn.replySenderAuthPrivKey !== null;
      console.log("[SMP] sendToReplyQueue: SEND body=" + sendBody.length + "B, signed=" + signed);
      const targetServer = this.resolveTargetServer(conn.contactAddress);
      let serverForConnection = toSMPServerAddress(targetServer);
      if (this.config.queueServer) {
        serverForConnection = toSMPServerAddress({
          hosts: this.config.queueServer.hosts,
          port: this.config.queueServer.port,
          serverIdentity: targetServer.serverIdentity
        });
      }
      const client = await this.agent.getClient(serverForConnection);
      const params = { notification: false, encMessage: sendBody };
      if (signed && conn.replySenderAuthPrivKey) {
        await client.sendMessageSigned(conn.replyQueue.senderId, params, conn.replySenderAuthPrivKey);
      } else {
        await client.sendMessage(conn.replyQueue.senderId, params);
      }
      console.log("[SMP] sendToReplyQueue: SEND accepted (OK)");
    }
    // --- Public send methods ---
    /**
     * Send AgentConfirmation to CLI's reply queue (handshake completion).
     * Uses agentVersion=7, tag 'C', PHConfirmation 'K', e2ePubKey=Just.
     */
    async sendHandshake(connectionId, displayName) {
      const conn = this.connections.get(connectionId);
      if (!conn) throw new Error("Connection not found: " + connectionId);
      if (conn.handshakeSent) {
        console.log("[SMP] sendHandshake: already sent, skipping");
        return;
      }
      console.log("[SMP] sendHandshake: starting for '" + displayName + "'");
      const connInfoJson = JSON.stringify({
        v: "1-16",
        event: "x.info",
        params: {
          profile: {
            displayName,
            fullName: "",
            preferences: {
              calls: { allow: "no" },
              files: { allow: "no" },
              voice: { allow: "no" },
              reactions: { allow: "yes" },
              fullDelete: { allow: "no" },
              timedMessages: { allow: "yes" }
            }
          }
        }
      });
      const connInfoBytes = new TextEncoder().encode(connInfoJson);
      const agentMessage = new Uint8Array(1 + connInfoBytes.length);
      agentMessage[0] = 73;
      agentMessage.set(connInfoBytes, 1);
      const senderAuthKeyPair = generateX25519KeyPair();
      const senderAuthKeySPKI = encodeX25519PublicKey(senderAuthKeyPair.publicKey);
      await this.sendEncrypted(
        conn,
        agentMessage,
        7,
        // agentVersion = 7 for AgentConfirmation
        67,
        // 'C' = AgentConfirmation
        new Uint8Array([48]),
        // Maybe e2eEncryption_ = Nothing '0'
        true,
        // first message to reply queue -> e2ePubKey=Just, pad 15904
        (envelope) => {
          const smpConf = new Uint8Array(1 + 1 + senderAuthKeySPKI.length + envelope.length);
          smpConf[0] = 75;
          smpConf[1] = senderAuthKeySPKI.length;
          smpConf.set(senderAuthKeySPKI, 2);
          smpConf.set(envelope, 2 + senderAuthKeySPKI.length);
          return smpConf;
        }
      );
      conn.replySenderAuthPrivKey = senderAuthKeyPair.privateKey;
      conn.handshakeSent = true;
      console.log("[SMP] sendHandshake: complete! (sender auth key stored for signed SENDs)");
    }
    /**
     * Send HELLO to CLI after receiving their HELLO.
     * Uses agentVersion=1, tag 'M'. HELLO has no body after 'H' tag.
     */
    async sendHello(connectionId) {
      const conn = this.connections.get(connectionId);
      if (!conn) throw new Error("Connection not found: " + connectionId);
      console.log("[SMP] sendHello: sending HELLO to CLI");
      const privHeader = this.buildAPrivHeader(conn);
      const agentMessage = new Uint8Array(1 + privHeader.length + 1);
      agentMessage[0] = 77;
      agentMessage.set(privHeader, 1);
      agentMessage[1 + privHeader.length] = 72;
      await this.sendEncrypted(
        conn,
        agentMessage,
        1,
        // agentVersion = 1 for AgentMsgEnvelope (NOT 7!)
        77,
        // 'M' = AgentMsgEnvelope
        null,
        // no extra bytes after tag
        false,
        // subsequent message -> e2ePubKey=Nothing, pad 15840
        (envelope) => {
          const smpConf = new Uint8Array(1 + envelope.length);
          smpConf[0] = 95;
          smpConf.set(envelope, 1);
          return smpConf;
        }
      );
      console.log("[SMP] sendHello: HELLO sent to CLI!");
    }
    /**
     * Send an encrypted chat message to CLI.
     * Uses agentVersion=1, tag 'M'. Body is JSON x.msg.new.
     */
    async sendChatMessage(connectionId, text) {
      const conn = this.connections.get(connectionId);
      if (!conn) throw new Error("Connection not found: " + connectionId);
      console.log("[SMP] sendChatMessage: sending '" + text.substring(0, 50) + "'");
      const jsonBody = new TextEncoder().encode(JSON.stringify({
        event: "x.msg.new",
        params: {
          content: {
            text,
            type: "text"
          }
        }
      }));
      const privHeader = this.buildAPrivHeader(conn);
      const agentMessage = new Uint8Array(1 + privHeader.length + 1 + jsonBody.length);
      agentMessage[0] = 77;
      agentMessage.set(privHeader, 1);
      agentMessage[1 + privHeader.length] = 77;
      agentMessage.set(jsonBody, 2 + privHeader.length);
      await this.sendEncrypted(
        conn,
        agentMessage,
        1,
        // agentVersion = 1 for AgentMsgEnvelope (NOT 7!)
        77,
        // 'M' = AgentMsgEnvelope
        null,
        // no extra bytes after tag
        false,
        // subsequent message -> e2ePubKey=Nothing, pad 15840
        (envelope) => {
          const smpConf = new Uint8Array(1 + envelope.length);
          smpConf[0] = 95;
          smpConf.set(envelope, 1);
          return smpConf;
        }
      );
      console.log("[SMP] sendChatMessage: message sent!");
    }
    /**
     * Send x.direct.del notification to the agent before disconnecting.
     * Best effort - silently fails if connection is not CONNECTED or queue is gone.
     */
    async sendDeleteNotification(connectionId) {
      const conn = this.connections.get(connectionId);
      if (!conn) return;
      if (conn.state.state !== "CONNECTED") return;
      if (!conn.replyQueue || !conn.handshakeSent) return;
      console.log("[SMP] sendDeleteNotification: notifying agent");
      const jsonBody = new TextEncoder().encode(JSON.stringify({
        event: "x.direct.del",
        params: {}
      }));
      const privHeader = this.buildAPrivHeader(conn);
      const agentMessage = new Uint8Array(1 + privHeader.length + 1 + jsonBody.length);
      agentMessage[0] = 77;
      agentMessage.set(privHeader, 1);
      agentMessage[1 + privHeader.length] = 77;
      agentMessage.set(jsonBody, 2 + privHeader.length);
      await this.sendEncrypted(
        conn,
        agentMessage,
        1,
        // agentVersion = 1 (NOT 7!)
        77,
        // 'M' = AgentMsgEnvelope
        null,
        false,
        (envelope) => {
          const smpConf = new Uint8Array(1 + envelope.length);
          smpConf[0] = 95;
          smpConf.set(envelope, 1);
          return smpConf;
        }
      );
      console.log("[SMP] sendDeleteNotification: agent notified");
    }
    async closeConnection(connectionId) {
      const conn = this.connections.get(connectionId);
      if (!conn) return;
      if (conn.receiveQueue && !conn.state.isTerminal) {
        try {
          const targetServer = this.resolveTargetServer(conn.contactAddress);
          const serverAddress = toSMPServerAddress(targetServer);
          const client = await this.agent.getClient(serverAddress);
          await client.deleteQueue(conn.receiveQueue.recipientId);
        } catch (_e) {
        }
      }
      if (!conn.state.isTerminal) {
        conn.state.transition("close");
      } else if (conn.state.state === "ERROR") {
        conn.state.transition("close");
      }
    }
    resolveTargetServer(contactAddress) {
      let addressIdentity = "";
      if (contactAddress.format === "full") {
        addressIdentity = contactAddress.data.smpQueues[0].server.serverIdentity;
      } else {
        addressIdentity = contactAddress.data.server.serverIdentity;
      }
      if (this.config.queueServer) {
        return {
          hosts: this.config.queueServer.hosts,
          port: this.config.queueServer.port,
          serverIdentity: this.config.queueServer.serverIdentity || addressIdentity
        };
      }
      if (contactAddress.format === "full") {
        const q = contactAddress.data.smpQueues[0];
        return {
          hosts: q.server.hosts,
          port: q.server.port,
          serverIdentity: q.server.serverIdentity
        };
      }
      return {
        hosts: contactAddress.data.server.hosts,
        port: contactAddress.data.server.port,
        serverIdentity: contactAddress.data.server.serverIdentity
      };
    }
  };

  // src/browser-client.ts
  var DEFAULT_CONTACT_ADDRESS = "https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow%3D%40smp.simplego.dev%2FrvmTVkY_dMRMA9L4jlaQsDPZeyCUktxq%23%2F%3Fv%3D1-4%26dh%3DMCowBQYDK2VuAyEAnIg32wSmfYdGHlO7qthFkn2wZmwcF2cOJHbmVnkkZjI%253D%26q%3Dc";
  function generateRandomVisitorName() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return "Visitor-" + suffix;
  }
  function resolveContactAddress() {
    if (typeof window !== "undefined" && window.GOCHAT_CONFIG?.contactAddress) {
      return window.GOCHAT_CONFIG.contactAddress;
    }
    if (typeof document !== "undefined") {
      const dock = document.getElementById("gc-panel-dock");
      if (dock?.dataset?.contactAddress) {
        return dock.dataset.contactAddress;
      }
    }
    return DEFAULT_CONTACT_ADDRESS;
  }
  function resolveServerUrl() {
    if (typeof window !== "undefined" && window.GOCHAT_CONFIG?.serverUrl) {
      return window.GOCHAT_CONFIG.serverUrl;
    }
    if (typeof document !== "undefined") {
      const dock = document.getElementById("gc-panel-dock");
      if (dock?.dataset?.serverUrl) {
        return dock.dataset.serverUrl;
      }
    }
    return void 0;
  }
  var BrowserClientImpl = class {
    constructor(config) {
      __publicField(this, "config");
      __publicField(this, "agent", null);
      __publicField(this, "connManager", null);
      __publicField(this, "conn", null);
      __publicField(this, "currentStatus", "offline");
      __publicField(this, "unsubscribeState", null);
      __publicField(this, "messageQueue", []);
      __publicField(this, "connectionTimeout", null);
      this.config = config;
    }
    get status() {
      return this.currentStatus;
    }
    async connect(displayName) {
      if (this.currentStatus === "connecting" || this.currentStatus === "connected" || this.currentStatus === "pending") {
        return;
      }
      const name = displayName || this.config.displayName || "Website Visitor";
      return this.connectWithName(name);
    }
    /**
     * Connect to the SMP server with the given display name.
     */
    async connectWithName(displayName) {
      this.setStatus("connecting");
      console.log("[SMP] BrowserClient.connect: displayName='" + displayName + "'");
      try {
        console.log("[SMP] BrowserClient.connect: creating agent, serverUrl=" + (this.config.serverUrl || "(none)"));
        this.agent = this.config._agent ?? newSMPAgent();
        const queueServer = this.config.serverUrl ? parseServerUrl(this.config.serverUrl) : void 0;
        this.connManager = new ConnectionManager(this.agent, {
          subscribeMode: "S",
          sndSecure: true,
          queueServer
        });
        try {
          this.conn = await this.connManager.initiateConnection(this.config.contactAddress);
        } catch (initErr) {
          const msg = initErr instanceof Error ? initErr.message : String(initErr);
          throw new Error("initiateConnection failed: " + msg);
        }
        this.unsubscribeState = this.conn.state.onStateChange((event) => {
          this.handleStateChange(event);
        });
        this.setupMessageHandler();
        if (this.conn.contactQueue) {
          try {
            await this.connManager.sendInvitation(this.conn.state.id, displayName);
            console.log("[SMP] BrowserClient.connect: invitation sent as '" + displayName + "'");
            await this.connManager.setupMsgHandler(this.conn.state.id, (msgBody) => {
              console.log("[SMP] BrowserClient: received MSG body " + msgBody.length + "B");
            });
            this.conn.onChatMessage = (text) => {
              this.handleChatPayload(text);
            };
            if (this.config.onDeliveryReceipt) {
              this.conn.onDeliveryReceipt = (agentMsgId) => {
                console.log("[SMP] BrowserClient: delivery receipt for msgId=" + agentMsgId);
                this.config.onDeliveryReceipt(agentMsgId);
              };
            }
            this.conn.onConnectionEnded = () => {
              if (this.currentStatus === "offline") return;
              console.log("[SMP] BrowserClient: connection ended by peer");
              this.config.onMessage("[Connection ended by support agent]");
              this.setStatus("offline");
            };
            this.connectionTimeout = setTimeout(() => {
              if (this.currentStatus === "pending") {
                console.log("[SMP] Connection timeout - no response from agent");
                this.config.onMessage("[No response from support. Please try again later.]");
                this.setStatus("offline");
              }
            }, 12e4);
          } catch (invErr) {
            const msg = invErr instanceof Error ? invErr.message : String(invErr);
            console.log("[SMP] BrowserClient.connect: invitation FAILED: " + msg);
          }
        }
        this.setStatus("pending");
      } catch (err) {
        this.setStatus("error");
        if (this.config.onError && err instanceof Error) {
          this.config.onError(err);
        }
        throw err;
      }
    }
    async send(text) {
      if (this.currentStatus === "offline" || this.currentStatus === "error") {
        throw new Error("Cannot send: not connected (status: " + this.currentStatus + ")");
      }
      if (!this.conn || !this.connManager) {
        throw new Error("Cannot send: connection not fully established");
      }
      const msg = {
        id: Date.now() + "-" + Math.random().toString(36).slice(2),
        text,
        timestamp: Date.now(),
        status: "queued"
      };
      if (this.config.onOwnMessage) {
        this.config.onOwnMessage(msg);
      }
      if (this.conn.state.state === "CONNECTED") {
        msg.status = "sending";
        if (this.config.onMessageStatusChange) {
          this.config.onMessageStatusChange(msg.id, "sending");
        }
        try {
          await this.connManager.sendChatMessage(this.conn.state.id, text);
          msg.status = "sent";
          if (this.config.onMessageStatusChange) {
            this.config.onMessageStatusChange(msg.id, "sent");
          }
        } catch (err) {
          msg.status = "failed";
          if (this.config.onMessageStatusChange) {
            this.config.onMessageStatusChange(msg.id, "failed");
          }
          if (this.config.onError && err instanceof Error) {
            this.config.onError(err);
          }
          throw err;
        }
      } else {
        this.messageQueue.push(msg);
        console.log("[SMP] BrowserClient.send: queued message (state=" + this.conn.state.state + ", queue=" + this.messageQueue.length + ")");
      }
    }
    async disconnect() {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      if (this.conn && this.connManager) {
        try {
          await this.connManager.sendDeleteNotification(this.conn.state.id);
        } catch (_e) {
        }
        try {
          await this.connManager.closeConnection(this.conn.state.id);
        } catch (_e) {
        }
      }
      if (this.unsubscribeState) {
        this.unsubscribeState();
        this.unsubscribeState = null;
      }
      if (this.agent) {
        this.agent.closeAll();
        this.agent = null;
      }
      this.connManager = null;
      this.conn = null;
      this.setStatus("offline");
    }
    // -- Internal methods
    setStatus(status) {
      if (this.currentStatus === status) return;
      this.currentStatus = status;
      this.config.onStatusChange(status);
    }
    handleStateChange(event) {
      switch (event.newState) {
        case "CONNECTED":
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.setStatus("connected");
          this.flushMessageQueue();
          break;
        case "CLOSED":
          this.setStatus("offline");
          break;
        case "ERROR":
          this.setStatus("error");
          if (event.error && this.config.onError) {
            this.config.onError(new Error(event.error.message));
          }
          break;
        case "PENDING":
        case "CONFIRMED":
          this.setStatus("pending");
          break;
        case "QUEUE_CREATED":
          this.setStatus("connecting");
          break;
      }
    }
    /**
     * Parse incoming chat payload JSON and route to appropriate handler.
     * Only x.msg.new text is forwarded to onMessage. Other events are
     * handled internally or logged.
     */
    handleChatPayload(jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        const event = parsed.event;
        if (event === "x.msg.new") {
          const text = parsed.params?.content?.text;
          if (text) {
            console.log("[SMP] BrowserClient: chat message: " + text.substring(0, 100));
            this.config.onMessage(text);
          }
        } else if (event === "x.direct.del") {
          console.log("[SMP] BrowserClient: contact deleted by support agent");
          this.config.onMessage("[Connection ended by support agent]");
          this.setStatus("offline");
        } else {
          console.log("[SMP] BrowserClient: unhandled event: " + event);
        }
      } catch (_) {
        console.log("[SMP] BrowserClient: non-JSON message: " + jsonStr.substring(0, 100));
        this.config.onMessage(jsonStr);
      }
    }
    flushMessageQueue() {
      if (this.messageQueue.length === 0) return;
      if (!this.conn || !this.connManager) return;
      const connId = this.conn.state.id;
      const queue = [...this.messageQueue];
      this.messageQueue = [];
      console.log("[SMP] BrowserClient: flushing " + queue.length + " queued message(s)");
      const sendNext = async (index) => {
        if (index >= queue.length) return;
        const msg = queue[index];
        msg.status = "sending";
        if (this.config.onMessageStatusChange) {
          this.config.onMessageStatusChange(msg.id, "sending");
        }
        try {
          await this.connManager.sendChatMessage(connId, msg.text);
          msg.status = "sent";
          if (this.config.onMessageStatusChange) {
            this.config.onMessageStatusChange(msg.id, "sent");
          }
          console.log("[SMP] BrowserClient: queued message " + (index + 1) + "/" + queue.length + " sent");
        } catch (err) {
          msg.status = "failed";
          if (this.config.onMessageStatusChange) {
            this.config.onMessageStatusChange(msg.id, "failed");
          }
          console.log("[SMP] BrowserClient: queued message " + (index + 1) + " failed: " + (err instanceof Error ? err.message : String(err)));
        }
        await sendNext(index + 1);
      };
      sendNext(0).catch(() => {
      });
    }
    setupMessageHandler() {
      if (!this.conn || !this.agent) return;
      const wssServer = this.config.serverUrl ? parseServerUrl(this.config.serverUrl) : null;
      let serverHost;
      let serverPort;
      if (wssServer) {
        serverHost = wssServer.hosts[0];
        serverPort = wssServer.port;
      } else if (this.conn.contactAddress.format === "full") {
        const q = this.conn.contactAddress.data.smpQueues[0];
        serverHost = q.server.hosts[0];
        serverPort = q.server.port;
      } else {
        serverHost = this.conn.contactAddress.data.server.hosts[0];
        serverPort = this.conn.contactAddress.data.server.port;
      }
      let serverIdentity = "";
      if (this.conn.contactAddress.format === "full") {
        serverIdentity = this.conn.contactAddress.data.smpQueues[0].server.serverIdentity;
      } else {
        serverIdentity = this.conn.contactAddress.data.server.serverIdentity;
      }
      const serverAddress = {
        host: serverHost,
        port: serverPort,
        keyHash: base64urlDecode2(serverIdentity)
      };
      this.agent.getClient(serverAddress).then((client) => {
        client.onMessage((_recipientId, _msgId, encryptedBody) => {
          try {
            const text = new TextDecoder().decode(encryptedBody);
            this.config.onMessage(text);
          } catch (_e) {
          }
        });
      }).catch(() => {
      });
    }
  };
  function createBrowserClient(config) {
    return new BrowserClientImpl(config);
  }
  function parseServerUrl(url) {
    let hostPart = url;
    if (hostPart.startsWith("wss://")) hostPart = hostPart.substring(6);
    else if (hostPart.startsWith("https://")) hostPart = hostPart.substring(8);
    const slashIdx = hostPart.indexOf("/");
    if (slashIdx !== -1) hostPart = hostPart.substring(0, slashIdx);
    const colonIdx = hostPart.lastIndexOf(":");
    let hostname;
    let port = 443;
    if (colonIdx > 0) {
      const portCandidate = hostPart.substring(colonIdx + 1);
      const portNum = parseInt(portCandidate, 10);
      if (!isNaN(portNum) && portNum > 0 && portNum <= 65535 && portCandidate === String(portNum)) {
        hostname = hostPart.substring(0, colonIdx);
        port = portNum;
      } else {
        hostname = hostPart;
      }
    } else {
      hostname = hostPart;
    }
    return { hosts: [hostname], port, serverIdentity: "" };
  }
  function base64urlDecode2(s) {
    if (!s || s.length === 0) return new Uint8Array(0);
    let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    ConnectionManager: () => ConnectionManager,
    ConnectionStateMachine: () => ConnectionStateMachine,
    ContactAddressError: () => ContactAddressError,
    DEFAULT_CONTACT_ADDRESS: () => DEFAULT_CONTACT_ADDRESS,
    Decoder: () => Decoder,
    InvalidTransitionError: () => InvalidTransitionError,
    SMPTransportError: () => SMPTransportError,
    SMPWebSocketTransport: () => SMPWebSocketTransport,
    blockPad: () => blockPad,
    blockUnpad: () => blockUnpad,
    buildAgentConfirmation: () => buildAgentConfirmation,
    buildCommandBlock: () => buildCommandBlock,
    buildConnInfoJSON: () => buildConnInfoJSON,
    buildConnectionRequest: () => buildConnectionRequest,
    buildInvitation: () => buildInvitation,
    buildInvitationConnInfo: () => buildInvitationConnInfo,
    buildSmpConfirmation: () => buildSmpConfirmation,
    buildSmpConfirmationWithKey: () => buildSmpConfirmationWithKey,
    buildSmpEncConfirmation: () => buildSmpEncConfirmation,
    calculateBackoff: () => calculateBackoff,
    chainKdf: () => chainKdf,
    compatibleVRange: () => compatibleVRange,
    concatBytes: () => concatBytes,
    connectSMP: () => connectSMP,
    createBrowserClient: () => createBrowserClient,
    decodeBool: () => decodeBool,
    decodeBytes: () => decodeBytes,
    decodeLarge: () => decodeLarge,
    decodeList: () => decodeList,
    decodeMaybe: () => decodeMaybe,
    decodeSMPServerHandshake: () => decodeSMPServerHandshake,
    decodeWord16: () => decodeWord16,
    decodeX448PublicKey: () => decodeX448PublicKey,
    decryptEncConnInfo: () => decryptEncConnInfo,
    decryptLayer1: () => decryptLayer1,
    decryptMsgBody: () => decryptMsgBody,
    encodeACK: () => encodeACK,
    encodeBool: () => encodeBool,
    encodeBytes: () => encodeBytes,
    encodeDEL: () => encodeDEL,
    encodeEd25519PublicKey: () => encodeEd25519PublicKey,
    encodeGET: () => encodeGET,
    encodeKEY: () => encodeKEY,
    encodeLarge: () => encodeLarge,
    encodeList: () => encodeList,
    encodeMaybe: () => encodeMaybe,
    encodeNDEL: () => encodeNDEL,
    encodeNEW: () => encodeNEW,
    encodeNKEY: () => encodeNKEY,
    encodeNSUB: () => encodeNSUB,
    encodeOFF: () => encodeOFF,
    encodePING: () => encodePING,
    encodeQUE: () => encodeQUE,
    encodeSEND: () => encodeSEND,
    encodeSKEY: () => encodeSKEY,
    encodeSMPClientHandshake: () => encodeSMPClientHandshake,
    encodeSUB: () => encodeSUB,
    encodeWord16: () => encodeWord16,
    encodeX25519PublicKey: () => encodeX25519PublicKey,
    encodeX448PublicKey: () => encodeX448PublicKey,
    extractRawX25519: () => extractRawX25519,
    generateEd25519KeyPair: () => generateEd25519KeyPair,
    generateRandomVisitorName: () => generateRandomVisitorName,
    generateX25519KeyPair: () => generateX25519KeyPair,
    generateX448KeyPair: () => generateX448KeyPair,
    initRcvRatchet: () => initRcvRatchet,
    initSendRatchet: () => initSendRatchet,
    newSMPAgent: () => newSMPAgent,
    pad: () => pad,
    parseAgentConfirmation: () => parseAgentConfirmation,
    parseAgentConnInfoReply: () => parseAgentConnInfoReply,
    parseAllTransmissions: () => parseAllTransmissions,
    parseContactAddress: () => parseContactAddress,
    parseEncRatchetMessage: () => parseEncRatchetMessage,
    parseRcvMsgBody: () => parseRcvMsgBody,
    parseResponseBlock: () => parseResponseBlock,
    parseSMPQueueURI: () => parseSMPQueueURI,
    parseSMPServer: () => parseSMPServer,
    parseSmpConfirmation: () => parseSmpConfirmation,
    parseSmpEncConfirmation: () => parseSmpEncConfirmation,
    performX3DH: () => performX3DH,
    ratchetEncrypt: () => ratchetEncrypt,
    rcDecrypt: () => rcDecrypt,
    rcEncrypt: () => rcEncrypt,
    resolveContactAddress: () => resolveContactAddress,
    resolveServerUrl: () => resolveServerUrl,
    rootKdf: () => rootKdf,
    serverKey: () => serverKey,
    smpClientVersionRange: () => smpClientVersionRange,
    unPad: () => unPad,
    validateBase64url: () => validateBase64url,
    verifyServerIdentity: () => verifyServerIdentity,
    x25519DH: () => x25519DH,
    x3dhReceiver: () => x3dhReceiver,
    x448DH: () => x448DH,
    zstdCompress: () => zstdCompress
  });

  // widget/widget-entry.ts
  window.createBrowserClient = createBrowserClient;
  window.GoChatClient = {
    ...src_exports,
    createBrowserClient,
    generateRandomVisitorName,
    DEFAULT_CONTACT_ADDRESS
  };
  var scriptTag = document.currentScript;
  function initWidget() {
    const config = {
      contactAddress: scriptTag?.getAttribute("data-contact-address") || "",
      serverUrl: scriptTag?.getAttribute("data-server-url") || "",
      position: scriptTag?.getAttribute("data-position") || "bottom-right",
      trigger: scriptTag?.getAttribute("data-trigger") || "floating",
      name: scriptTag?.getAttribute("data-name") || "GoChat",
      welcome: scriptTag?.getAttribute("data-welcome") || "",
      color: scriptTag?.getAttribute("data-color") || "#45bdd1",
      bubbleAnimation: scriptTag?.getAttribute("data-bubble-animation") || "shimmer-flip",
      lang: scriptTag?.getAttribute("data-lang") || "en"
    };
    const zIndex = parseInt(scriptTag?.getAttribute("data-z-index") || "10000", 10);
    if (typeof HTMLElement.prototype.attachShadow !== "function") {
      console.error("[GoChat] Shadow DOM not supported in this browser");
      return;
    }
    const host = document.createElement("div");
    host.id = "gochat-widget-host";
    host.style.cssText = "position:fixed;z-index:" + zIndex + ";bottom:0;right:0;pointer-events:none;";
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap";
    shadow.appendChild(fontLink);
    const style = document.createElement("style");
    let css = WIDGET_CSS;
    if (config.color && config.color !== "#45bdd1") {
      css = css.replace(
        "var(--gochat-color-primary, #45bdd1)",
        "var(--gochat-color-primary, " + config.color + ")"
      );
    }
    if (config.position === "bottom-left") {
      css = css.replace("bottom:24px;right:24px;", "bottom:24px;left:24px;");
      css = css.replace("bottom:90px;right:24px;", "bottom:90px;left:24px;");
      css = css.replace("bottom:16px;right:16px;", "bottom:16px;left:16px;");
    }
    style.textContent = css;
    shadow.appendChild(style);
    const container = document.createElement("div");
    container.style.cssText = "pointer-events:all;";
    container.innerHTML = WIDGET_TEMPLATE;
    shadow.appendChild(container);
    if (config.trigger !== "custom") {
      const bubbleContainer = document.createElement("div");
      bubbleContainer.style.cssText = "pointer-events:all;";
      bubbleContainer.innerHTML = BUBBLE_TEMPLATE;
      shadow.appendChild(bubbleContainer);
    }
    initUI(shadow, host, config);
    console.log("[GoChat] Widget initialized" + (config.contactAddress ? "" : " (mock mode - no contact address)"));
  }
  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        try {
          initWidget();
        } catch (err) {
          console.error("[GoChat] Widget initialization failed:", err);
        }
      });
    } else {
      initWidget();
    }
  } catch (err) {
    console.error("[GoChat] Widget initialization failed:", err);
  }
})();
/*! Bundled license information:

@noble/hashes/utils.js:
@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/utils.js:
@noble/curves/abstract/modular.js:
@noble/curves/abstract/curve.js:
@noble/curves/abstract/edwards.js:
@noble/curves/abstract/montgomery.js:
@noble/curves/ed25519.js:
@noble/curves/ed448.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
*/
