# Anleitung: trade.inc starten und vorführen

## 1. Spiel starten

Voraussetzung: [Node.js](https://nodejs.org) ab Version 18 (getestet mit 25).

```bash
git clone https://github.com/oleHWR/trade.inc.git
cd trade.inc
npm install
npm run dev
```

Dann im Browser `http://localhost:5173` öffnen.

Für einen stabilen Präsentationsbuild (schneller, ohne Dev-Overhead):

```bash
npm run build
npm run preview
```

Danach `http://localhost:4173` öffnen.

### Spielen in 60 Sekunden

1. Auf dem Titelscreen Laufzeit (5 / 10 / 15 / 20 Min) und Schwierigkeit wählen, dann **New run**.
2. Intro mit Enter oder Klick durchgehen (**Skip intro** überspringt es).
3. Ziel: aus **$20.000** werden **$1.000.000**. Die Eltern prüfen dein Vermögen an festen Tagen (Banner oben). Zu wenig = Burger-Job.
4. Nachrichten erscheinen als Marker auf der Karte, im Feed und im Ticker. Marker anklicken, Text lesen, passendes Asset in **Markets** wählen.
5. Rechts unten handeln: **Long** (Buy/Sell) bei steigenden, **Short** (Short/Cover) bei fallenden Kursen.
6. **Pause** (oder Leertaste) stoppt die Zeit. Gehandelt wird nur ohne Pause.

Tipp: Meldungen mit **Developing** haben meist einen Folge-Event. Wer vorher positioniert ist, gewinnt. **Breaking** wirkt sofort, der Preis hat sich dann schon bewegt.

## 2. Demo starten

Die Demo ist ein normaler Lauf mit zwei URL-Parametern:

| Parameter | Wirkung |
| --- | --- |
| `duration=300` | Lauf dauert 5 Minuten statt 10 (Sekunden, 300 = 5 Min) |
| `seed=42` | Fester Eventplan: jeder Lauf erzeugt dieselben Nachrichten zu denselben Tagen |

**Demo-URL (Dev-Server):** `http://localhost:5173/?duration=300&seed=42`  
**Demo-URL (Preview-Build):** `http://localhost:4173/?duration=300&seed=42`

Danach auf dem Titelscreen **New run** klicken. Die Laufzeit ist über die URL vorbelegt. Der Marktrauschen-Verlauf der Kurse bleibt trotzdem zufällig. Der Eventplan ist fix.

### Vorschlag für den Demo-Ablauf (Seed 42, ca. 3 Minuten)

Bei 5 Minuten Laufzeit ist 1 Spieltag = 3 Sekunden. Mit **2×** oder **4×** läuft es schneller.

| Zeit | Spieltag | Was passiert | Was zeigen |
| --- | --- | --- | --- |
| ca. 5 s | 1,7 | "Central bank announces an announcement about interest rates" (Developing) | Ankündigung lesen, Karte, Marker. Jetzt **Long** auf ALB, MCH, BMU oder HYPE |
| ca. 13 s | 4,4 | Banknoten-Schriftart-Streit (Euro) | Sofort-Schock, Kurs hat sich schon bewegt |
| ca. 20 s | 6,7 | "Rates cut: markets confused but excited" | Positionierte Aktien springen. Gewinn mitnehmen, **Sell** |
| ca. 30 s | 9,9 | Rechenzentrum-Brand | Short auf CAI oder MCH zeigen (**Short** / **Cover**) |
| ca. 51 s | 17,1 | NotRugpullCoin "bleibt definitiv" | Kurs steigt, dann Folge-Event nach 3 Tagen: Totalabsturz mit Erholung |
| ca. 60 s | 10 | Erster Eltern-Check (mind. $5.000) | Checkpoint-Banner, Nachricht von Mom |

Zum Abschluss der Präsentation das Ende zeigen. Siegbild oder Burger-Vertrag lassen sich im Dev-Server direkt auslösen. Dazu in der Browser-Konsole eingeben:

```js
// Sieg
__store.state.cashCents = 100_000_000;
// Niederlage (Bankrott)
__store.state.cashCents = 0;
```

Das geht nur mit `npm run dev`. Im Preview-Build ist `__store` nicht verfügbar.

## 3. Weitere Befehle

```bash
npm run validate:content   # prüft assets.json und events.json
npm run test:engine        # 74 Verhaltenstests der Spiellogik
npm run sim -- 150         # Balance-Test mit Bots
```

## 4. Probleme

| Problem | Lösung |
| --- | --- |
| Seite bleibt leer | `npm install` vergessen oder Node zu alt |
| Port 5173 belegt | Vite wählt automatisch den nächsten Port, die Adresse steht im Terminal |
| Spiel läuft nicht weiter | Pausiert? Leertaste drücken. Der Browser-Tab muss sichtbar sein |
| Alten Lauf loswerden | Menü `⋯` oben rechts, **Restart run** |
