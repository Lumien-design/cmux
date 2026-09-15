// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "CmuxMac",
    platforms: [.macOS(.v15)],
    products: [
        .library(name: "CmuxSidebar", targets: ["CmuxSidebar"]),
        .executable(name: "cmux-sidebar-demo", targets: ["CmuxSidebarDemo"]),
    ],
    targets: [
        .target(name: "CmuxSidebar"),
        .executableTarget(name: "CmuxSidebarDemo", dependencies: ["CmuxSidebar"]),
        .testTarget(name: "CmuxSidebarTests", dependencies: ["CmuxSidebar"]),
    ]
)
