const std = @import("std");
const Target = std.Target;

pub fn build(b: *std.build.Builder) void {
    const target = b.standardTargetOptions(.{
        .default_target = .{
            .cpu_arch = .wasm32,
            .cpu_model = .{ .explicit = &Target.wasm.cpu.generic },
            .os_tag = .freestanding,
        }
    });
    const mode = b.standardReleaseOptions();

    const module = b.addSharedLibrary("analysis", "./analysis.zig", .unversioned);
    module.export_symbol_names = &[_][]const u8{
        "malloc", "free", "fast_analyze_dat64",
    };
    module.setTarget(target);
    module.setBuildMode(mode);
    module.install();
}
