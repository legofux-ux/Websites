// Bausteine für die Werkstatt-Demo. Vorbereitete Texte, kein Live-Modell.

export const FIGURES = {
  fuchs: {
    Name: 'Der Fuchs',
    name: 'der Fuchs',
    opening: 'Am Rand eines Weizenfelds lebte ein Fuchs, der für jede Frage eine schnelle Antwort hatte.',
  },
  schildkroete: {
    Name: 'Die Schildkröte',
    name: 'die Schildkröte',
    opening: 'Unter einem alten Feigenbaum wohnte eine Schildkröte, die jeden Weg zweimal bedachte, bevor sie ihn ging.',
  },
  rabe: {
    Name: 'Der Rabe',
    name: 'der Rabe',
    opening: 'Hoch oben im Kirchturm saß ein Rabe, der alles sammelte, was glänzte – am liebsten Worte.',
  },
  ameise: {
    Name: 'Die Ameise',
    name: 'die Ameise',
    opening: 'Zwischen den Wurzeln einer Eiche arbeitete eine Ameise, die nie aufhörte, nach dem Wozu zu fragen.',
  },
};

export const MORALS = {
  geduld: {
    middle: (f) => `Eines Tages trat der Bach über die Ufer und versperrte den Weg zum Markt. Alle Tiere riefen durcheinander, jedes mit einem anderen Plan. ${f.Name} aber setzte sich ans Wasser und sah zu, wie es floss – wo es tief war, wo flach, wo die Steine lagen.`,
    end: (f) => `Als die anderen müde wurden, stand ${f.name} auf und ging den einen Weg, der trocken blieb. Bald folgten alle anderen.`,
    moral: 'Wer zuerst versteht, muss nicht zweimal laufen.',
  },
  neugier: {
    middle: (f) => `Eines Morgens fand ${f.name} eine verschlossene Kiste im Moos. Die anderen Tiere rieten, was darin sei, und stritten bald über ihre Vermutungen. ${f.Name} jedoch betrachtete die Kiste von allen Seiten und fragte: Wer hat sie hier gelassen – und warum?`,
    end: () => 'So fand sich unter dem Deckel kein Schatz, sondern ein Brief, und aus dem Brief eine Freundschaft, die keines der Tiere gesucht hatte.',
    moral: 'Eine gute Frage öffnet mehr als jeder Schlüssel.',
  },
  wahrheit: {
    middle: (f) => `Als der Winter kam, wollten die Tiere wissen, ob die Vorräte reichen würden. Die Elster versprach, es werde schon gehen; der Dachs schwieg. ${f.Name} zählte nach, Korn für Korn, und sagte offen: Es reicht nicht – aber es reicht, wenn wir teilen.`,
    end: () => 'Die Wahrheit war unbequem, doch sie kam früh genug. Und so kam jedes Tier durch den Winter.',
    moral: 'Ehrlichkeit ist die freundlichste Form von Hilfe.',
  },
};
