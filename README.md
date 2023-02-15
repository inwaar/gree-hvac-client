# Gree HVAC client

A client for communicating with Gree air conditioners.

## Requirements

- NodeJS (>=8.11.0)

## Installation

`yarn add gree-hvac-client`

or

`npm install --save gree-hvac-client`


## Simple usage

Set device properties:

```javascript
const Gree = require('gree-hvac-client');

const client = new Gree.Client({host: '192.168.7.60'});

client.on('connect', () => {
    client.setProperty(Gree.PROPERTY.temperature, 25);
    client.setProperty(Gree.PROPERTY.lights, Gree.VALUE.lights.off);
});
```


Poll device properties:

```javascript
const Gree = require('gree-hvac-client');

const client = new Gree.Client({host: '192.168.7.60'});

client.on('connect', (client) => {
    console.log('connected to', client.getDeviceId());
});
client.on('update', (updatedProperties, properties) => {
    console.log(updatedProperties, properties);
});
client.on('no_response', () => {
    console.log('no response');
});

```

## Properties

| Command | Values | Description |
|-|-|-|
| **temperature** | any integer |In degrees Celsius by default |
| **currentTemperature** | any integer |In degrees Celsius by default. (Read-only) |
| **mode** | _auto_, _cool_, _heat_, _dry_, _fan_only_|Operation mode |
| **fanspeed** | _auto_, _low_, _mediumLow_, _medium_, _mediumHigh_, _high_ | Fan speed |
| **swinghor** | _default_, _full_, _fixedLeft_, _fixedMidLeft_, _fixedMid_, _fixedMidRight_, _fixedRight_ | Horizontal Swing |
| **swingvert** | _default_, _full_, _fixedTop_, _fixedMidTop_, _fixedMid_, _fixedMidBottom_, _fixedBottom_, _swingBottom_, _swingMidBottom_, _swingMid_, _swingMidTop_, _swingTop_ | Vetical swing |
| **power** | _off_, _on_ | Turn device on/off |
| **health** | _off_, _on_ | Health ("Cold plasma") mode, only for devices equipped with "anion generator", which absorbs dust and kills bacteria |
| **powersave** | _off_, _on_ | Power Saving mode |
| **lights** | _off_, _on_ | Turn on/off device lights |
| **quiet** | _off_, _mode1_, _mode2_, _mode3_ | Quiet modes |
| **blow** | _off_, _on_ | Keeps the fan running for a while after shutting down (also called "X-Fan", only usable in Dry and Cool mode) |
| **air** | _off_, _inside_, _outside_, _mode3_ | Fresh air valve |
| **sleep** | _off_, _on_ | Sleep mode |
| **turbo** | _off_, _on_ | Turbo mode |

## Configuring HVAC WiFi

1. Make sure your HVAC is running in AP mode. You can reset the WiFi config by pressing MODE +WIFI (or MODE + TURBO) on the AC remote for 5s.
2. Connect with the AP wifi network (the SSID name should be a 8-character alfanumeric, e.g. "u34k5l166").
3. Run the following in your UNIX terminal:

```shell
echo -n "{\"psw\": \"YOUR_WIFI_PASSWORD\",\"ssid\": \"YOUR_WIFI_SSID\",\"t\": \"wlan\"}" | nc -cu 192.168.1.1 7000
````

Note: This command may vary depending on your OS (e.g. Linux, macOS, CygWin). If facing problems, please consult the appropriate netcat manual.

## API Reference
## Classes

<dl>
<dt><a href="#Client">Client</a></dt>
<dd><p>Control GREE HVAC device by getting and setting its properties</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#CLIENT_OPTIONS">CLIENT_OPTIONS</a></dt>
<dd><p>Client options</p>
</dd>
<dt><a href="#PROPERTY_VALUE">PROPERTY_VALUE</a></dt>
<dd><p>Device properties value constants</p>
</dd>
<dt><a href="#PROPERTY">PROPERTY</a></dt>
<dd><p>Device properties constants</p>
</dd>
</dl>

<a name="Client"></a>

## Client
Control GREE HVAC device by getting and setting its properties

**Kind**: global class  

* [Client](#Client)
    * [new Client(options)](#new_Client_new)
    * [.connect()](#Client+connect)
    * [.disconnect()](#Client+disconnect)
    * [.setProperties(properties)](#Client+setProperties)
    * [.setProperty(property, value)](#Client+setProperty)
    * [.getDeviceId()](#Client+getDeviceId) ⇒ <code>string</code> \| <code>null</code>

<a name="new_Client_new"></a>

### new Client(options)
Creates a new client, connect to device and start polling by default.


| Param | Type |
| --- | --- |
| options | [<code>CLIENT\_OPTIONS</code>](#CLIENT_OPTIONS) \| <code>Object</code> | 

**Example**  
```js
const Gree = require('gree-hvac-client');

const client = new Gree.Client({host: '192.168.1.69'});
client.on('connect', () => {
    client.setProperty(Gree.PROPERTY.lights, Gree.VALUE.lights.off);
    client.setProperty(Gree.PROPERTY.temperature, 25);
});
```
<a name="Client+connect"></a>

### client.connect()
Connect to a HVAC device and start polling status changes by default

**Kind**: instance method of [<code>Client</code>](#Client)  
<a name="Client+disconnect"></a>

### client.disconnect()
Disconnect from a HVAC device and stop status polling

**Kind**: instance method of [<code>Client</code>](#Client)  
<a name="Client+setProperties"></a>

### client.setProperties(properties)
Set a list of device properties at once by one request

**Kind**: instance method of [<code>Client</code>](#Client)  

| Param | Type |
| --- | --- |
| properties | <code>Object.&lt;PROPERTY, PROPERTY\_VALUE&gt;</code> | 

**Example**  
```js
// use library constants

const properties = {};
properties[Gree.PROPERTY.lights] = Gree.VALUE.lights.off;
properties[Gree.PROPERTY.blow] = Gree.VALUE.blow.off;
properties[Gree.PROPERTY.fanSpeed] = Gree.VALUE.fanSpeed.high;
properties[Gree.PROPERTY.temperature] = 25;
client.setProperties(properties);
```
**Example**  
```js
// use plain objects

client.setProperties({
 lights: 'off',
 blow: 'off',
 fanSpeed: 'high',
 temperature: 25
});
```
<a name="Client+setProperty"></a>

### client.setProperty(property, value)
Set device property

**Kind**: instance method of [<code>Client</code>](#Client)  

| Param | Type |
| --- | --- |
| property | [<code>PROPERTY</code>](#PROPERTY) | 
| value | [<code>PROPERTY\_VALUE</code>](#PROPERTY_VALUE) | 

**Example**  
```js
// use library constants

client.setProperty(Gree.PROPERTY.swingHor, Gree.VALUE.swingHor.fixedLeft);
client.setProperty(Gree.PROPERTY.temperature, 25);
```
**Example**  
```js
// use plain values

client.setProperty('swingHor', 'fixedLeft');
client.setProperty('temperature', 25);
```
<a name="Client+getDeviceId"></a>

### client.getDeviceId() ⇒ <code>string</code> \| <code>null</code>
Returns devices MAC-address

**Kind**: instance method of [<code>Client</code>](#Client)  
<a name="CLIENT_OPTIONS"></a>

## CLIENT\_OPTIONS
Client options

**Kind**: global constant  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| host | <code>string</code> | <code>&quot;192.168.1.255&quot;</code> | GREE device ip-address |
| port | <code>number</code> | <code>7000</code> | GREE device UDP port |
| connectTimeout | <code>number</code> | <code>3000</code> | Reconnect to device if no success timeout |
| autoConnect | <code>boolean</code> | <code>true</code> | Automatically connect to device when client is created. Alternatively method `connect()` can be used. |
| poll | <code>boolean</code> | <code>true</code> | Poll device properties |
| pollingInterval | <code>number</code> | <code>3000</code> | Device properties polling interval |
| pollingTimeout | <code>number</code> | <code>1000</code> | Device properties polling timeout, emits `no_response` events in case of no response from HVAC device for a status request |
| debug | <code>boolean</code> | <code>false</code> | Trace debug information |

<a name="PROPERTY_VALUE"></a>

## PROPERTY\_VALUE
Device properties value constants

**Kind**: global constant  
**Read only**: true  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| power.on | <code>string</code> |  |
| power.off | <code>string</code> |  |
| mode.auto | <code>string</code> |  |
| mode.dry | <code>string</code> |  |
| mode.fan_only | <code>string</code> |  |
| mode.heat | <code>string</code> |  |
| temperatureUnit.celsius | <code>string</code> |  |
| temperatureUnit.fahrenheit | <code>string</code> |  |
| fanSpeed.auto | <code>string</code> |  |
| fanSpeed.low | <code>string</code> |  |
| fanSpeed.mediumLow | <code>string</code> | Not available on 3-speed units |
| fanSpeed.medium | <code>string</code> |  |
| fanSpeed.mediumHigh | <code>string</code> | Not available on 3-speed units |
| fanSpeed.high | <code>string</code> |  |
| air.off | <code>string</code> |  |
| air.inside | <code>string</code> |  |
| air.outside | <code>string</code> |  |
| air.mode3 | <code>string</code> |  |
| blow.off | <code>string</code> |  |
| blow.on | <code>string</code> |  |
| health.off | <code>string</code> |  |
| health.on | <code>string</code> |  |
| sleep.off | <code>string</code> |  |
| sleep.on | <code>string</code> |  |
| lights.off | <code>string</code> |  |
| lights.on | <code>string</code> |  |
| swingHor.default | <code>string</code> |  |
| swingHor.full | <code>string</code> | Swing in full range |
| swingHor.fixedLeft | <code>string</code> | Fixed in leftmost position (1/5) |
| swingHor.fixedMidLeft | <code>string</code> | Fixed in middle-left postion (2/5) |
| swingHor.fixedMid | <code>string</code> | Fixed in middle position (3/5) |
| swingHor.fixedMidRight | <code>string</code> | Fixed in middle-right postion (4/5) |
| swingHor.fixedRight | <code>string</code> | Fixed in rightmost position (5/5) |
| swingHor.fullAlt | <code>string</code> | Swing in full range (seems to be same as full) |
| swingVert.default | <code>string</code> |  |
| swingVert.full | <code>string</code> | Swing in full range |
| swingVert.fixedTop | <code>string</code> | Fixed in the upmost position (1/5) |
| swingVert.fixedMidTop | <code>string</code> | Fixed in the middle-up position (2/5) |
| swingVert.fixedMid | <code>string</code> | Fixed in the middle position (3/5) |
| swingVert.fixedMidBottom | <code>string</code> | Fixed in the middle-low position (4/5) |
| swingVert.fixedBottom | <code>string</code> | Fixed in the lowest position (5/5) |
| swingVert.swingBottom | <code>string</code> | Swing in the downmost region (5/5) |
| swingVert.swingMidBottom | <code>string</code> | Swing in the middle-low region (4/5) |
| swingVert.swingMid | <code>string</code> | Swing in the middle region (3/5) |
| swingVert.swingMidTop | <code>string</code> | Swing in the middle-up region (2/5) |
| swingVert.swingTop | <code>string</code> | Swing in the upmost region (1/5) |
| quiet.off | <code>string</code> |  |
| quiet.mode1 | <code>string</code> |  |
| quiet.mode2 | <code>string</code> |  |
| quiet.mode3 | <code>string</code> |  |
| turbo.off | <code>string</code> |  |
| turbo.on | <code>string</code> |  |
| powerSave.off | <code>string</code> |  |
| powerSave.on | <code>string</code> |  |

<a name="PROPERTY"></a>

## PROPERTY
Device properties constants

**Kind**: global constant  
**Read only**: true  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| power | <code>string</code> | Power state of the device |
| mode | <code>string</code> | Mode of operation |
| temperatureUnit | <code>string</code> | Temperature unit (must be together with set temperature) |
| temperature | <code>string</code> | Set temperature (must be together with temperature unit) |
| currentTemperature | <code>string</code> | Get current temperature from the internal (?) sensor (This value can not be set, only received. HVAC must support this feature otherwise the value is 0) |
| fanSpeed | <code>string</code> | Fan speed |
| air | <code>string</code> | Fresh air valve |
| blow | <code>string</code> | Keeps the fan running for a while after shutting down (also called "X-Fan", only usable in Dry and Cool mode) |
| health | <code>string</code> | Controls Health ("Cold plasma") mode, only for devices equipped with "anion generator", which absorbs dust and kills bacteria |
| sleep | <code>string</code> | Sleep mode, which gradually changes the temperature in Cool, Heat and Dry mode |
| lights | <code>string</code> | Turns all indicators and the display on the unit on or off |
| swingHor | <code>string</code> | Controls the swing mode of the horizontal air blades (not available on all units) |
| swingVert | <code>string</code> | Controls the swing mode of the vertical air blades |
| quiet | <code>string</code> | Controls the Quiet mode which slows down the fan to its most quiet speed. Not available in Dry and Fan mode |
| turbo | <code>string</code> | Sets fan speed to the maximum. Fan speed cannot be changed while active and only available in Dry and Cool mode |
| powerSave | <code>string</code> | Power saving mode |


## License

This project is licensed under the GNU GPLv3 - see the [LICENSE](LICENSE) file for details

## Acknowledgments

- [tomikaa87](https://github.com/tomikaa87) for reverse-engineering the Gree protocol
- [oroce](https://github.com/oroce) for inspiration
- [arthurkrupa](https://github.com/arthurkrupa) for inspiration
