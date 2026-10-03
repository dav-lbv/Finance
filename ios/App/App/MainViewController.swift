import Capacitor

/// Contrôleur principal : enregistre les plugins natifs propres à l'application.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(KandaICloudPlugin())
    }
}
