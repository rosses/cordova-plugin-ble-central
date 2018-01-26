// (c) 2014-2016 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global cordova, module */
"use strict";

var stringToArrayBuffer = function(str) {
    var ret = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
        ret[i] = str.charCodeAt(i);
    }
    // TODO would it be better to return Uint8Array?
    return ret.buffer;
};

var base64ToArrayBuffer = function(b64) {
    return stringToArrayBuffer(atob(b64));
};

function massageMessageNativeToJs(message) {
    if (message.CDVType == 'ArrayBuffer') {
        message = base64ToArrayBuffer(message.data);
    }
    return message;
}

function GLPin(input) {
    return input * 1000000 * 0.015 + 0.5;
}
function GLPmt(input) {
    return GLPin(input) / 39.3701;
}
function GLPcm(input) {
    return (GLPmt(input) / 100);
}
function GLPStars(input) {
    if (parseInt(input) <= 5) {return 0;}
    else if (parseInt(input) > 5 && parseInt(input) <= 15) {return 1;}
    else if (parseInt(input) > 15 && parseInt(input) <= 30) {return 2;}
    else if (parseInt(input) > 30) { return 3; }
}
function batteryPorcentage(input) {
    var c = (input - 2.2) / 0.65 * 100;
    if (c > 100) { c = 100; }
    else if (c < 0) { c = 0; }
    return c;
}
function batteryVoltage(input) {
    return input / 256.0 * 2.0 + 1.5;
}

// Cordova 3.6 doesn't unwrap ArrayBuffers in nested data structures
// https://github.com/apache/cordova-js/blob/94291706945c42fd47fa632ed30f5eb811080e95/src/ios/exec.js#L107-L122
function convertToNativeJS(object) {
    Object.keys(object).forEach(function (key) {
        var value = object[key];
        object[key] = massageMessageNativeToJs(value);
        if (typeof(value) === 'object') {
            convertToNativeJS(value);
        }
    });
}

module.exports = {


    streamGascheck: function(did, success, failure) {
        
        var successWrapperx = function(peripheral) {
            convertToNativeJS(peripheral);
            var res = {
                element: {},
                peripheral: {},
                level: 0,
                height: 0,
                trust: 0,
                batteryLeft: 0
            };

            console.log("peripheral", peripheral);
            console.log("typeof peripheral.advertising", typeof peripheral.advertising);
            if (peripheral.advertising) {
                //console.log("peripheral advertising is defined");
                if (typeof peripheral.advertising == 'object') {
                    //android
                    //console.log("peripheral advertising - android -");
                    var adData = new Uint8Array(peripheral.advertising);
                    //console.log("adData:", adData);
                    //console.log("adData 0:",adData[0]);
                    if (adData[0] == 26) { // manufacturer 
                        console.log("peripheral is 26!");
                        var u8 = adData.slice(2, 2 + 25);
                        var base64 = btoa(String.fromCharCode.apply(null, u8));
                        console.log("base64: ",base64);
                        var x = {
                            bdaddr: peripheral.id,
                            manufacturerData: base64
                        };
                        console.log("x: ",x);
                        
                        console.log("xmlHTTP Started");
                        var xmlhttp = new XMLHttpRequest();
                        xmlhttp.open("POST", "http://dpt4jyt0x5.execute-api.sa-east-1.amazonaws.com/v1/calculate_tc_sensor_level");
                        xmlhttp.setRequestHeader("Content-Type", "application/json");
                        xmlhttp.setRequestHeader("X-Api-Key", "q0T2CnyBHH4OfPXeUZmVjaUSdyN84ot48ZoYF2h4");
                        xmlhttp.send(JSON.stringify(x));

                        xmlhttp.onreadystatechange = function (oEvent) {  
                            console.log("xmlHTTP onreadystatechange");
                            if (xmlhttp.readyState === 4) {  
                                if (xmlhttp.status === 200) {  
                                    console.log("Success API", xmlhttp.responseText);
                                    
                                    var resJson = JSON.parse(xmlhttp.responseText);
                                    res.element = x;
                                    res.peripheral = peripheral;
                                    res.level = resJson.rawLevel;
                                    res.trust = parseInt(GLPStars(resJson.quality));
                                    res.height = parseFloat(GLPmt(resJson.lpgLevel));
                                    res.batteryLeft = parseInt(batteryPorcentage(resJson.voltage));

                                    success(res);

                                } else {  
                                    console.log("Error API", xmlhttp.statusText);
                                    failure(xmlhttp.statusText);
                                }
                            }  
                        };

                        xmlhttp.ontimeout = function (e) {
                          failure("API Timeout");
                        };
                        

                        
                    }
                    else {
                        // not Mopeka GasCheck
                    }
                }
                else {
                    //ios
                    console.log('iOS - GasCheck detected');
                    console.log(peripheral);
                }
            }
        };
        var options = { // Todos los dispositivos
            reportDuplicates: false
        };
        var services = []; // Todos los servicios

        cordova.exec(successWrapperx, failure, 'BLE', 'startScanWithOptions', [services, options]);
    },

    listenGascheck: function(success, failure) {
        
        var parent = this;

        var successWrapperListing = function(peripheral) {
            convertToNativeJS(peripheral);

            console.log("peripheral", peripheral);
            console.log("typeof peripheral.advertising", typeof peripheral.advertising);
            if (peripheral.advertising) {
                if (typeof peripheral.advertising == 'object') {
                    var adData = new Uint8Array(peripheral.advertising);
                    if (adData[0] == 26) { // manufacturer 
                        var u8 = adData.slice(2, 2 + 25);
                        var base64 = btoa(String.fromCharCode.apply(null, u8));
                        var x = {
                            isValid: 1,
                            bdaddr: peripheral.id,
                            manufacturerData: base64
                        };
                        parent.success(x);
                    }
                    else {
                        // not Mopeka GasCheck
                        var x = {
                            isValid: 0,
                            bdaddr: peripheral.id,
                            manufacturerData: ''
                        };
                        parent.success(x);
                    }
                }
                else {
                    //ios
                    console.log('iOS - GasCheck detected');
                    console.log(peripheral);
                }
            }
            else {
                // not advertising
                var x = {
                    isValid: 0,
                    bdaddr: peripheral.id,
                    manufacturerData: ''
                };
                parent.success(x);
            }
        };
        var options = { // Todos los dispositivos
            reportDuplicates: false
        };
        var services = []; // Todos los servicios

        cordova.exec(successWrapperListing, failure, 'BLE', 'startScanWithOptions', [services, options]);
    },

    scan: function (services, seconds, success, failure) {
        var successWrapper = function(peripheral) {
            convertToNativeJS(peripheral);
            success(peripheral);
        };
        cordova.exec(successWrapper, failure, 'BLE', 'scan', [services, seconds]);
    },

    startScan: function (services, success, failure) {
        var successWrapper = function(peripheral) {
            convertToNativeJS(peripheral);
            success(peripheral);
        };
        cordova.exec(successWrapper, failure, 'BLE', 'startScan', [services]);
    },

    stopScan: function (success, failure) {
        cordova.exec(success, failure, 'BLE', 'stopScan', []);
    },

    startScanWithOptions: function(services, options, success, failure) {
        var successWrapper = function(peripheral) {
            convertToNativeJS(peripheral);
            success(peripheral);
        };
        options = options || {};
        cordova.exec(successWrapper, failure, 'BLE', 'startScanWithOptions', [services, options]);
    },

    // this will probably be removed
    list: function (success, failure) {
        cordova.exec(success, failure, 'BLE', 'list', []);
    },

    connect: function (device_id, success, failure) {
        var successWrapper = function(peripheral) {
            convertToNativeJS(peripheral);
            success(peripheral);
        };
        cordova.exec(successWrapper, failure, 'BLE', 'connect', [device_id]);
    },

    disconnect: function (device_id, success, failure) {
        cordova.exec(success, failure, 'BLE', 'disconnect', [device_id]);
    },

    // characteristic value comes back as ArrayBuffer in the success callback
    read: function (device_id, service_uuid, characteristic_uuid, success, failure) {
        cordova.exec(success, failure, 'BLE', 'read', [device_id, service_uuid, characteristic_uuid]);
    },

    // RSSI value comes back as an integer
    readRSSI: function(device_id, success, failure) {
        cordova.exec(success, failure, 'BLE', 'readRSSI', [device_id]);
    },

    // value must be an ArrayBuffer
    write: function (device_id, service_uuid, characteristic_uuid, value, success, failure) {
        cordova.exec(success, failure, 'BLE', 'write', [device_id, service_uuid, characteristic_uuid, value]);
    },

    // value must be an ArrayBuffer
    writeWithoutResponse: function (device_id, service_uuid, characteristic_uuid, value, success, failure) {
        cordova.exec(success, failure, 'BLE', 'writeWithoutResponse', [device_id, service_uuid, characteristic_uuid, value]);
    },

    // value must be an ArrayBuffer
    writeCommand: function (device_id, service_uuid, characteristic_uuid, value, success, failure) {
        console.log("WARNING: writeCommand is deprecated, use writeWithoutResponse");
        cordova.exec(success, failure, 'BLE', 'writeWithoutResponse', [device_id, service_uuid, characteristic_uuid, value]);
    },

    // success callback is called on notification
    notify: function (device_id, service_uuid, characteristic_uuid, success, failure) {
        console.log("WARNING: notify is deprecated, use startNotification");
        cordova.exec(success, failure, 'BLE', 'startNotification', [device_id, service_uuid, characteristic_uuid]);
    },

    // success callback is called on notification
    startNotification: function (device_id, service_uuid, characteristic_uuid, success, failure) {
        cordova.exec(success, failure, 'BLE', 'startNotification', [device_id, service_uuid, characteristic_uuid]);
    },

    // success callback is called when the descriptor 0x2902 is written
    stopNotification: function (device_id, service_uuid, characteristic_uuid, success, failure) {
        cordova.exec(success, failure, 'BLE', 'stopNotification', [device_id, service_uuid, characteristic_uuid]);
    },

    isConnected: function (device_id, success, failure) {
        cordova.exec(success, failure, 'BLE', 'isConnected', [device_id]);
    },

    isEnabled: function (success, failure) {
        cordova.exec(success, failure, 'BLE', 'isEnabled', []);
    },

    enable: function (success, failure) {
        cordova.exec(success, failure, "BLE", "enable", []);
    },

    showBluetoothSettings: function (success, failure) {
        cordova.exec(success, failure, "BLE", "showBluetoothSettings", []);
    },

    startStateNotifications: function (success, failure) {
        cordova.exec(success, failure, "BLE", "startStateNotifications", []);
    },

    stopStateNotifications: function (success, failure) {
        cordova.exec(success, failure, "BLE", "stopStateNotifications", []);
    }

};

module.exports.withPromises = {
    scan: module.exports.scan,
    startScan: module.exports.startScan,
    startScanWithOptions: module.exports.startScanWithOptions,
    connect: module.exports.connect,
    startNotification: module.exports.startNotification,
    startStateNotifications: module.exports.startStateNotifications,

    stopScan: function() {
        return new Promise(function(resolve, reject) {
            module.exports.stopScan(resolve, reject);
        });
    },

    disconnect: function(device_id) {
        return new Promise(function(resolve, reject) {
            module.exports.disconnect(device_id, resolve, reject);
        });
    },

    read: function(device_id, service_uuid, characteristic_uuid) {
        return new Promise(function(resolve, reject) {
            module.exports.read(device_id, service_uuid, characteristic_uuid, resolve, reject);
        });
    },

    write: function(device_id, service_uuid, characteristic_uuid, value) {
        return new Promise(function(resolve, reject) {
            module.exports.write(device_id, service_uuid, characteristic_uuid, value, resolve, reject);
        });
    },

    writeWithoutResponse: function (device_id, service_uuid, characteristic_uuid, value) {
        return new Promise(function(resolve, reject) {
            module.exports.writeWithoutResponse(device_id, service_uuid, characteristic_uuid, value, resolve, reject);
        });
    },

    stopNotification: function (device_id, service_uuid, characteristic_uuid) {
        return new Promise(function(resolve, reject) {
            module.exports.stopNotification(device_id, service_uuid, characteristic_uuid, resolve, reject);
        });
    },

    isConnected: function (device_id) {
        return new Promise(function(resolve, reject) {
            module.exports.isConnected(device_id, resolve, reject);
        });
    },

    isEnabled: function () {
        return new Promise(function(resolve, reject) {
            module.exports.isEnabled(resolve, reject);
        });
    },

    enable: function () {
        return new Promise(function(resolve, reject) {
            module.exports.enable(resolve, reject);
        });
    },

    showBluetoothSettings: function () {
        return new Promise(function(resolve, reject) {
            module.exports.showBluetoothSettings(resolve, reject);
        });
    },

    stopStateNotifications: function () {
        return new Promise(function(resolve, reject) {
            module.exports.stopStateNotifications(resolve, reject);
        });
    },

    readRSSI: function(device_id) {
        return new Promise(function(resolve, reject) {
            module.exports.readRSSI(device_id, resolve, reject);
        });
    }
};
