const std = @import("std");
const Target = std.Target;

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{
        .default_target = .{
            .cpu_arch = .wasm32,
            .cpu_model = .{ .explicit = &Target.wasm.cpu.generic },
            .os_tag = .freestanding,
        }
    });
    const optimize = b.standardOptimizeOption(.{});

    const module = b.addSharedLibrary(.{
        .name = "analysis",
        .root_source_file = .{ .path = "./analysis.zig" },
        .target = target,
        .optimize = optimize,
    });
    module.export_symbol_names = &[_][]const u8{
        "malloc", "free", "fast_analyze_dat64",
    };
    b.installArtifact(module);
}
