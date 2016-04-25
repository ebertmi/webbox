# Sourcebox Streams

> Zusammenfassung über die Funktionsweise und das Hinzufügen weiterer Streams zwischen
Server und Client.

Prinzipiell werden Duplex-Streams, z.B. `stdin`, `stdout` und `stderr`, über _WebSockets_
zum Client übertragen. Des Weiteren ist es möglich nun weitere Streams zu übertragen, damit
können nun weitere Anwendungen wie das Turtle-Module oder Matplotlib in den Browser
übertragen werden.

## Folgende Zusammenfassung von Herrn Henninger beschreibt das Thema noch einmal genauer:

Standardmäßig hat jeder Prozess drei Streams, die entweder nur readable (`stdout`, `stderr`)
oder *writeable* (`stdin`) sind oder, falls der Prozess in einem Terminal läuft,
referenzieren alle drei Stream Objekte den selben Duplex Stream.

Für zusätzliche Streams kann man beim Erzeugen eines Prozesses im *Options*-Objekt
das `"streams"`-Attribut auf eine Zahl setzen, dann bekommt man halt soviele zusätzliche
Duplex-Streams. Diese sind dann am Prozess-Objekt im `process.stdio` Array ab Position 3
verfügbar. Im Prozess selbst gibt es dann für jeden zusätzlichen Stream einen
weiteren offenen File Descriptor, die auch bei `3` anfangen.

Siehe Seite 50 in der Masterarbeit (61 im PDF) und Quellcode 4, der ein Beispiel zeigt
in dem Bash mit einem zusätzlichen Duplex Stream gestartet wird und dann Bash diesen FD
nutzt.

Im Beispiel wird der AttachedProcess über die [attach()](https://github.com/jhenninger/sourcebox-lxc/blob/master/lib/lxc.js#L94)-Methode
des Container-Objekts (LXC-Modul) erzeugt. Beim Sourcebox Sandbox bzw.
beim Web Modul hast man es aber eigentlich nie direkt mit dem Container-Objekt,
sondern mit nem Box-Objekt zu tun. Das Box-Objekt hat aber auch eine [attach()](https://github.com/jhenninger/sourcebox-sandbox/blob/master/lib/box.js#L144)-Methode
(bzw. Aliase exec() und spawn()), die sich genauso verhält und nur ein paar
andere [Defaultwerte](https://github.com/jhenninger/sourcebox-sandbox/blob/master/lib/box.js#L16-L25) hat. Siehe auch Seite 74 (85 im PDF) in der MA.

Das Web-Modul erzeugt automatisch eine Sandbox [sobald der Client irgendeine Methode
aufruft](https://github.com/jhenninger/sourcebox-web/blob/master/lib/server/session.js#L42-L43),
die eine Sandbox benötigt. In der [Session-Klasse](https://github.com/jhenninger/sourcebox-web/blob/master/lib/server/session.js) wird dann, sobald die
Sandbox bereit ist, die entsprechende `_onEVENT()` Methode aufgerufen, die dann
wiederum die `onEVENT()`-Methode aufruft. Also z.B. [exec()](https://github.com/jhenninger/sourcebox-web/blob/master/lib/client/client.js#L103-L114) am Client-Objekt
ruft [_onExec()](https://github.com/jhenninger/sourcebox-web/blob/master/lib/server/session.js#L177-L302)
in der Session auf, was wiederum [onExec()](https://github.com/jhenninger/sourcebox-web/blob/master/lib/server/session.js#L304-L314) aufruft. Die Idee war,
dass man die Methoden ohne Unterstrich überschreiben kann um das Verhalten zu ändern,
währen die Unterstrichmethoden das ganze "heavy lifting" übernehmen, also bei
Prozessen z.B. das Aufsetzen der Streams. Siehe Seite 87 in der MA (98 im PDF).
Es spricht aber nichts dagegen, die zusätzlichen Streams in der `onExec()`-Methode
aufzusetzen, dann sparst du dir das forken. Es würde auch Sinn machen, hier die
JSON-Transformation von den Turtle Anweisungen vorzunehmen.

`OnExec()` erzeugt einen Prozess durch Aufruf der `exec()`-Methode. Bis jetzt werden
hier nur [wenige Optionen](https://github.com/jhenninger/sourcebox-web/blob/master/lib/server/session.js#L305), die vom Client geschickt wurden, beachtet (`term` und `cwd`).
Da müsste dann auch das _stream_-Attribut beachtet werden.

Wie gesagt, [setzt die _onExec() Methode die Streams auf](https://github.com/jhenninger/sourcebox-web/blob/master/lib/server/session.js#L245-L302)
und kümmert sich auch um das Cleanup. Es wird also für jeden Stream des Prozesses
bzw. im Terminalfall nur ein RemoteStream erzeugt. Dann werden die Output Streams
des Prozesses (`stdout`, `stderr`) in den Remote-Stream gepiped und und die Remote Streams
in `stdin` des Prozesses.

Auf Clientseite ist das ganz ähnlich. Hier gibt es ein [Process-Objekt](https://github.com/jhenninger/sourcebox-web/blob/master/lib/client/process.js) das dem
[Process-Objekt](https://github.com/jhenninger/sourcebox-lxc/blob/master/lib/attach.js#L105) auf Serverseite nachempfunden ist. Siehe Seite 90 in der MA (101 im PDF).
Hier wird auch für [jeden Stream ein RemoteStream erzeugt](https://github.com/jhenninger/sourcebox-web/blob/master/lib/client/process.js#L34-L43), die natürlich die gleichen
IDs haben müssen, wie auf Serverseite. Auf Clientseite [warten die RemoteStreams
außerdem, bis der Prozess auf serverseite läuft](https://github.com/jhenninger/sourcebox-web/blob/master/lib/client/process.js#L81-L86), bevor sie Daten anfordern.
Siehe das [letzte Argument im Konstruktor](https://github.com/jhenninger/sourcebox-web/blob/master/lib/common/remotestream.js#L17).

Für zusätzliche Streams muss man also den Server und Client Code erweitern,
damit die zusätzlichen RemoteStreams erzeugt werden.

[RemoteStreams](https://github.com/jhenninger/sourcebox-web/blob/master/lib/common/remotestream.js#L17) sind immer Duplex-Streams, auch wenn sie im nicht-terminal
Fall nur in eine Richtung genutzt werden. Jeder Stream braucht eine eindeutige ID,
die er dann als Event-Kanal für Socket.io verwendet. Deshalb hab ich eine
[Kombination aus File Descriptor Nummer und Prozess Nummer gewählt](https://github.com/jhenninger/sourcebox-web/blob/master/lib/client/process.js#L38).
(Hinweis: Prozess Nummer ist nicht die PID von Linux, sondern [wird vom Client vorgegeben](https://github.com/jhenninger/sourcebox-web/blob/master/lib/client/process.js#L28)).

Im Prinzip müssten die Remote Stream auch im [Object-Mode](https://nodejs.org/api/stream.html#stream_object_mode) gehen,
lediglich der Debug-Code könnte Probleme machen. Man muss halt
beim Aufruf des [super-Konstruktors](https://github.com/jhenninger/sourcebox-web/blob/master/lib/common/remotestream.js#L18) *ObjectMode* einschalten,
wenn gewünscht. Siehe auch die [node.js Duplex Doku](https://nodejs.org/api/stream.html#stream_new_stream_duplex_options).
