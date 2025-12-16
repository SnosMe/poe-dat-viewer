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

    const exe = b.addExecutable(.{
        .name = "analysis",
        .root_module = b.createModule(.{
            .root_source_file = b.path("./analysis.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    exe.root_module.export_symbol_names = &.{
        "malloc", "free", "fast_analyze_dat64",
    };
    exe.entry = .disabled;
    b.installArtifact(exe);
}
