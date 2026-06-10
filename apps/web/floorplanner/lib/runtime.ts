type FloorplannerRuntimeConfig = {
  cloudBasePath: string
  storageNamespace: string
  showLabel: string
}

const DEFAULT_RUNTIME_CONFIG: FloorplannerRuntimeConfig = {
  cloudBasePath: "",
  storageNamespace: "default",
  showLabel: "Floorplanner",
}

let runtimeConfig: FloorplannerRuntimeConfig = { ...DEFAULT_RUNTIME_CONFIG }

export function configureFloorplannerRuntime(nextConfig: Partial<FloorplannerRuntimeConfig>): void {
  runtimeConfig = {
    ...runtimeConfig,
    ...nextConfig,
  }
}

export function getFloorplannerCloudBasePath(): string {
  return runtimeConfig.cloudBasePath
}

export function getFloorplannerStorageNamespace(): string {
  return runtimeConfig.storageNamespace
}

export function getFloorplannerShowLabel(): string {
  return runtimeConfig.showLabel
}
