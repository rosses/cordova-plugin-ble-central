# Cordova Bluetooth Low Energy (BLE) Plugin for Abastible GasCheck

Este plugin es una bifurcación del plugin cordova-plugin-ble-central con las modificaciones para leer y encontrar dispositivos GasCheck para el dispositivo Abastible.

Todos los métodos de cordova-plugin-ble-central están disponibles, consultar la documentación asociada para obtener más información.

## Plataformas soportadas

* iOS (iOS 8 o superior)
* Android (4.3 o superior)

# Instalación

### Cordova

    $ cordova plugin add https://github.com/rosses/cordova-abastible-gascheck.git

### PhoneGap Build

En config.xml para instalar mediante la nube con [PhoneGap Build](http://build.phonegap.com).

    <preference name="phonegap-version" value="cli-6.5.0" />
    <plugin spec="https://github.com/rosses/cordova-abastible-gascheck.git" source="git" />

### iOS 10

Desde iOS 10, necesita indicar una descripción para el uso de Bluetooth, asegúrese de incluir la definición de [NSBluetoothPeripheralUsageDescription](https://developer.apple.com/library/prerelease/content/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html#//apple_ref/doc/uid/TP40009251-SW20) puede ver más información

Puede realizarlo mediante la declaración de variable

    $ cordova plugin add https://github.com/rosses/cordova-abastible-gascheck.git --variable BLUETOOTH_USAGE_DESCRIPTION="Medición de Cilindros GasCheck"

En [PhoneGap Build](http://build.phonegap.com)

    <plugin spec="https://github.com/rosses/cordova-plugin-ble-central.git" source="git">
      <param name="BLUETOOTH_USAGE_DESCRIPTION" value="Esta app necesita acceso a tu bluetooth" />
      <variable name="BLUETOOTH_USAGE_DESCRIPTION" value="Esta app necesita acceso a tu bluetooth" />
    </plugin>


# Feedback

Si tienes algún comentario contacta a rosses@blanco-brand.com

