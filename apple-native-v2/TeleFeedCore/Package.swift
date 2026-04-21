// swift-tools-version: 6.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "TeleFeedCore",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "TeleFeedCore",
            targets: ["TeleFeedCore"]
        ),
    ],
    targets: [
        .target(
            name: "TDLibC"
        ),
        .target(
            name: "TeleFeedCore",
            dependencies: ["TDLibC"],
            swiftSettings: [
                .interoperabilityMode(.Cxx)
            ],
            linkerSettings: [
                .linkedLibrary("tdjson"),
                .unsafeFlags(["-L/Users/k/Documents/PROJECTS/PROD/tele-feed/apple-native/Dependencies"])
            ]
        ),
        .testTarget(
            name: "TeleFeedCoreTests",
            dependencies: ["TeleFeedCore"]
        ),
    ],
    swiftLanguageModes: [.v6]
)
