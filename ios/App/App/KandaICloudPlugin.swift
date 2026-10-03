import Capacitor

/// Sauvegarde de la configuration dans iCloud (stockage clé-valeur, 1 Mo max).
/// Les données sont liées au compte iCloud de l'appareil : elles se retrouvent sur tout nouvel iPhone du même compte.
@objc(KandaICloudPlugin)
public class KandaICloudPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KandaICloudPlugin"
    public let jsName = "KandaICloud"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
    ]

    private let valueKey = "mon_kanda_backup"
    private let dateKey = "mon_kanda_backup_at"

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": FileManager.default.ubiquityIdentityToken != nil])
    }

    @objc func get(_ call: CAPPluginCall) {
        let store = NSUbiquitousKeyValueStore.default
        store.synchronize()
        guard let value = store.string(forKey: valueKey) else {
            call.resolve([:])
            return
        }
        call.resolve(["value": value, "modified": store.double(forKey: dateKey)])
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let value = call.getString("value") else {
            call.reject("Valeur manquante")
            return
        }
        let store = NSUbiquitousKeyValueStore.default
        store.set(value, forKey: valueKey)
        store.set(Date().timeIntervalSince1970, forKey: dateKey)
        call.resolve(["ok": store.synchronize()])
    }
}
