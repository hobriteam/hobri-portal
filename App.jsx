import React, { useMemo, useState } from "react";

const HOL_BRING_ZONE_PRICES = {
  0: 35, 1: 50, 2: 59, 3: 67, 4: 81, 5: 92, 6: 107, 7: 151, 8: 168,
};

const CLEANING_PRICES = {
  "LKW 7,5t–12t": { N1: 47.4, N3: 57.4, N6: 145, N7: 78.32, N9: 87.12 },
  "LKW 12t–18t": { N1: 55, N3: 69.4, N6: 167.4, N7: 87.12, N9: 94.16 },
};

const CLEANING_LABELS = {
  N1: "N1 – Wäsche",
  N3: "N3 – Wäsche Innen",
  N6: "N6 – Wäsche Komplett",
  N7: "N7 – NW1 klein",
  N9: "N9 – Auslieferung",
};

const SUB_DRIVERS = ["SUB Wolf"];
const MONTH_RANGE = "März 2026";
const INVOICE_RANGE = "10.03.2026 – 16.03.2026";

function money(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function toNumber(value) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getZoneFromKm(km) {
  if (km <= 2) return 0;
  if (km <= 5) return 1;
  if (km <= 10) return 2;
  if (km <= 15) return 3;
  if (km <= 25) return 4;
  if (km <= 35) return 5;
  if (km <= 45) return 6;
  if (km <= 55) return 7;
  if (km <= 70) return 8;
  return 9;
}

function demoKmFromParking(parking) {
  const p = parking.toLowerCase();
  if (p.includes("a")) return 12;
  if (p.includes("b")) return 19;
  if (p.includes("c")) return 28;
  if (p.includes("d")) return 48;
  if (p.includes("e")) return 96;
  return 30;
}

function demoKmFromRoute(from, to) {
  const route = `${from} ${to}`.toLowerCase();
  if (route.includes("fellbach")) return 12;
  if (route.includes("esslingen")) return 18;
  if (route.includes("ludwigsburg")) return 19;
  if (route.includes("böblingen")) return 28;
  if (route.includes("reutlingen")) return 48;
  if (route.includes("ulm")) return 96;
  return 25;
}

function calculateHolBring(km, trip, extraOption, redPlate, extraAmount) {
  const zone = getZoneFromKm(km);
  const extraKm = Math.max(0, km - 70);
  const extraKmPrice = zone === 9 ? extraKm * 1.8 : 0;
  const base = zone <= 8 ? HOL_BRING_ZONE_PRICES[zone] : HOL_BRING_ZONE_PRICES[8] + extraKmPrice;

  let tripAdjusted = base;
  if (trip === "Kombifahrt") tripAdjusted = base * 0.85;
  if (trip === "Mobifahrzeug") tripAdjusted = base * 0.75;

  const optionAuto = extraOption === "Außerhalb Einsatzzone (+30 %)" ? tripAdjusted * 0.3 : 0;
  const red = redPlate ? 50 : 0;

  return {
    zone, base, extraKm, extraKmPrice, tripAdjusted, optionAuto,
    fuel: 0, specialWork: 0, redPlate: red, manualExtra: extraAmount,
    total: tripAdjusted + optionAuto + red + extraAmount,
  };
}

function calculateCleaning(vehicleClass, cleanPackage, fuelService, specialHours, extraAmount) {
  const base = CLEANING_PRICES[vehicleClass][cleanPackage];
  const fuel = fuelService ? 22 : 0;
  const specialWork = specialHours * 45;
  return {
    zone: 0, base, extraKm: 0, extraKmPrice: 0, tripAdjusted: base, optionAuto: 0,
    fuel, specialWork, redPlate: 0, manualExtra: extraAmount,
    total: base + fuel + specialWork + extraAmount,
  };
}

function nextOrderId(count) {
  return `HOB-2026-${String(count + 1).padStart(5, "0")}`;
}

function statusBadge(status) {
  const map = {
    Neu: "bg-amber-100 text-amber-800",
    Geplant: "bg-blue-100 text-blue-800",
    Unterwegs: "bg-violet-100 text-violet-800",
    Erledigt: "bg-emerald-100 text-emerald-800",
  };
  return map[status];
}

function departmentBadge(department) {
  const map = {
    "Hol+Bring-Service": "bg-sky-100 text-sky-800",
    "CharterWay/Verkauf": "bg-orange-100 text-orange-800",
    "Aufbereitung": "bg-emerald-100 text-emerald-800",
  };
  return map[department];
}

function shortDepartment(department) {
  if (department === "Hol+Bring-Service") return "Hol+Bring";
  if (department === "CharterWay/Verkauf") return "CharterWay";
  return "Aufber.";
}

export default function App() {
  const [role, setRole] = useState("Admin");
  const [department, setDepartment] = useState("Hol+Bring-Service");
  const [repco, setRepco] = useState("REP-884521");
  const [plate, setPlate] = useState("S-HB 2406");
  const [vehicleClass, setVehicleClass] = useState("LKW 12t–18t");
  const [vehicleType, setVehicleType] = useState("Actros");
  const [parking, setParking] = useState("Parkplatz A");
  const [fromAddress, setFromAddress] = useState("Daimler Stuttgart");
  const [toAddress, setToAddress] = useState("Kunde Fellbach");
  const [km, setKm] = useState("12");
  const [trip, setTrip] = useState("Einfache Fahrt");
  const [extraOption, setExtraOption] = useState("Standard");
  const [extraAmount, setExtraAmount] = useState("0");
  const [redPlate, setRedPlate] = useState(false);
  const [fuelService, setFuelService] = useState(false);
  const [specialHours, setSpecialHours] = useState("0");
  const [cleanPackage, setCleanPackage] = useState("N6");
  const [driver, setDriver] = useState("SUB Wolf");
  const [status, setStatus] = useState("Neu");
  const [date, setDate] = useState("2026-03-09");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const [orders, setOrders] = useState([
    {
      id: "HOB-2026-00001",
      repco: "REP-884500",
      plate: "S-HB 1001",
      department: "Hol+Bring-Service",
      vehicleClass: "LKW 12t–18t",
      vehicleType: "Actros",
      from: "Daimler Stuttgart",
      to: "Kunde Fellbach",
      km: 12,
      zone: 3,
      trip: "Einfache Fahrt",
      extraOption: "Standard",
      extraAmount: 0,
      redPlate: false,
      fuelService: false,
      specialHours: 0,
      price: 67,
      driver: "SUB Wolf",
      status: "Geplant",
      handover: true,
      delivered: false,
      date: "2026-03-09",
      notes: "Kunde wartet vor Ort.",
    },
    {
      id: "HOB-2026-00002",
      repco: "REP-884501",
      plate: "S-HB 1002",
      department: "CharterWay/Verkauf",
      vehicleClass: "LKW 7,5t–12t",
      vehicleType: "Atego",
      from: "Daimler Stuttgart",
      to: "Kunde Ludwigsburg",
      km: 19,
      zone: 4,
      trip: "Kombifahrt",
      extraOption: "Wartezeit",
      extraAmount: 0,
      redPlate: false,
      fuelService: false,
      specialHours: 0,
      price: 68.85,
      driver: "SUB Wolf",
      status: "Unterwegs",
      handover: true,
      delivered: false,
      date: "2026-03-09",
    },
    {
      id: "HOB-2026-00003",
      repco: "REP-884502",
      plate: "S-HB 1003",
      department: "Aufbereitung",
      vehicleClass: "LKW 12t–18t",
      vehicleType: "Actros",
      parking: "Parkplatz C",
      km: 0,
      zone: 0,
      trip: "Einfache Fahrt",
      extraOption: "Tank / Maut / AdBlue",
      extraAmount: 0,
      redPlate: false,
      fuelService: true,
      specialHours: 2,
      cleanPackage: "N6",
      price: 279.4,
      driver: "SUB Wolf",
      status: "Erledigt",
      handover: true,
      delivered: true,
      date: "2026-03-08",
      notes: "Schlüssel in Infothek.",
    },
  ]);

  const summary = useMemo(() => {
    if (department === "Aufbereitung") {
      return calculateCleaning(vehicleClass, cleanPackage, fuelService, toNumber(specialHours), toNumber(extraAmount));
    }
    return calculateHolBring(toNumber(km), trip, extraOption, redPlate, toNumber(extraAmount));
  }, [department, vehicleClass, cleanPackage, fuelService, specialHours, extraAmount, km, trip, extraOption, redPlate]);

  const visibleOrders = useMemo(() => {
    const base = role === "Admin" || role === "Daimler" ? orders : orders.filter((order) => order.driver === "SUB Wolf");
    if (!search.trim()) return base;
    const s = search.toLowerCase();
    return base.filter((o) =>
      o.id.toLowerCase().includes(s) ||
      o.repco.toLowerCase().includes(s) ||
      o.plate.toLowerCase().includes(s) ||
      (o.from ?? "").toLowerCase().includes(s) ||
      (o.to ?? "").toLowerCase().includes(s) ||
      (o.parking ?? "").toLowerCase().includes(s) ||
      o.driver.toLowerCase().includes(s)
    );
  }, [orders, role, search]);

  const canSeeAllPrices = true;
  const canSeeInternalSplit = role === "Admin";

  const dashboard = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
    return {
      totalRevenue,
      count: orders.length,
      done: orders.filter((order) => order.status === "Erledigt").length,
      subCount: orders.filter((order) => order.driver === "SUB Wolf").length,
    };
  }, [orders]);

  const invoiceLines = useMemo(() => orders.filter((order) => order.status === "Erledigt"), [orders]);
  const invoiceTotal = useMemo(() => invoiceLines.reduce((sum, order) => sum + order.price, 0), [invoiceLines]);
  const totalOpenValue = useMemo(() => orders.reduce((sum, order) => sum + order.price, 0), [orders]);

  const PHASE2_START = new Date("2026-06-01");
  function getSubRate(dateStr) {
    const d = new Date(dateStr);
    return d < PHASE2_START ? 0.85 : 0.8;
  }

  const subMonthlyOrders = useMemo(() => orders.filter((order) => order.driver === "SUB Wolf"), [orders]);
  const subMonthlyRevenue = useMemo(() => subMonthlyOrders.reduce((sum, order) => sum + order.price, 0), [subMonthlyOrders]);
  const subMonthlyPayout = useMemo(() => subMonthlyOrders.reduce((sum, order) => sum + order.price * getSubRate(order.date), 0), [subMonthlyOrders]);
  const hobriMonthlyShare = useMemo(() => subMonthlyOrders.reduce((sum, order) => sum + order.price * (1 - getSubRate(order.date)), 0), [subMonthlyOrders]);
  const subLifetimeRevenue = useMemo(() => orders.filter((order) => order.driver === "SUB Wolf").reduce((sum, order) => sum + order.price, 0), [orders]);

  function handleRouteCalculation() {
    if (department === "Aufbereitung") {
      setKm(String(demoKmFromParking(parking)));
    } else {
      setKm(String(demoKmFromRoute(fromAddress, toAddress)));
    }
  }

  function handleCreateOrder() {
    const newOrder = {
      id: nextOrderId(orders.length),
      repco,
      plate,
      department,
      vehicleClass,
      vehicleType,
      from: department === "Aufbereitung" ? undefined : fromAddress,
      to: department === "Aufbereitung" ? undefined : toAddress,
      parking: department === "Aufbereitung" ? parking : undefined,
      km: department === "Aufbereitung" ? 0 : toNumber(km),
      zone: department === "Aufbereitung" ? 0 : summary.zone,
      trip,
      extraOption,
      extraAmount: toNumber(extraAmount),
      redPlate,
      fuelService,
      specialHours: toNumber(specialHours),
      cleanPackage: department === "Aufbereitung" ? cleanPackage : undefined,
      price: Number(summary.total.toFixed(2)),
      driver,
      status,
      handover: false,
      delivered: false,
      date,
      notes,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setNotes("");
  }

  function toggleProof(orderId, field) {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, [field]: !order[field] } : order)));
  }

  const dayGroups = Array.from(new Set(visibleOrders.map((order) => order.date))).sort();

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-[1680px] space-y-6">
        <div className="rounded-[28px] bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-medium">HobriTeam Portal · Testversion</div>
              <h1 className="text-3xl font-bold">HobriTeam Gesamtportal</h1>
              <p className="mt-1 text-sm text-red-50">Rollen · Fachbereiche · Disposition · Leistungsnachweis · Sammelrechnung</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <CardStat label="Aufträge" value={dashboard.count} />
              <CardStat label="Erledigt" value={dashboard.done} />
              <CardStat label="SUB Wolf" value={dashboard.subCount} />
              <CardStat label="Umsatz" value={money(dashboard.totalRevenue)} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[420px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Panel title="Rollen & Rechte" right={<span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{role}</span>}>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <option>Admin</option>
                <option>Daimler</option>
                <option>Sub</option>
              </select>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <div>Admin: Vollzugriff, Aufträge, Preise, Rechnung, Rechte.</div>
                <div>Daimler: Aufträge anlegen, Status sehen, Preise sehen, Nachweise prüfen.</div>
                <div>Sub: nur eigene Aufträge, Preise sehen, Übergabe und Zustellung bestätigen.</div>
              </div>
            </Panel>

            <Panel title="Neue Auftragsmaske">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Fachbereich" span="md:col-span-2">
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls}>
                    <option>Hol+Bring-Service</option>
                    <option>CharterWay/Verkauf</option>
                    <option>Aufbereitung</option>
                  </select>
                </Field>

                <Field label="Repco / Auftrags-Nr.">
                  <input value={repco} onChange={(e) => setRepco(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Kennzeichen">
                  <input value={plate} onChange={(e) => setPlate(e.target.value)} className={inputCls} />
                </Field>

                <Field label="Fahrzeugklasse">
                  <select value={vehicleClass} onChange={(e) => setVehicleClass(e.target.value)} className={inputCls}>
                    <option>LKW 7,5t–12t</option>
                    <option>LKW 12t–18t</option>
                  </select>
                </Field>
                <Field label="Fahrzeugtyp">
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputCls}>
                    <option>Actros</option>
                    <option>Atego</option>
                    <option>Sonstige</option>
                  </select>
                </Field>

                {department === "Aufbereitung" ? (
                  <Field label="Parkplatz" span="md:col-span-2">
                    <input value={parking} onChange={(e) => setParking(e.target.value)} className={inputCls} />
                  </Field>
                ) : (
                  <>
                    <Field label="Start" span="md:col-span-2">
                      <input value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Ziel" span="md:col-span-2">
                      <input value={toAddress} onChange={(e) => setToAddress(e.target.value)} className={inputCls} />
                    </Field>
                  </>
                )}

                {department !== "Aufbereitung" ? (
                  <>
                    <Field label="LKW-km">
                      <input value={km} onChange={(e) => setKm(e.target.value)} type="number" className={inputCls} />
                    </Field>
                    <Field label="Fahrtart">
                      <select value={trip} onChange={(e) => setTrip(e.target.value)} className={inputCls}>
                        <option>Einfache Fahrt</option>
                        <option>Kombifahrt</option>
                        <option>Mobifahrzeug</option>
                      </select>
                    </Field>
                    <Field label="Extra Option">
                      <select value={extraOption} onChange={(e) => setExtraOption(e.target.value)} className={inputCls}>
                        <option>Standard</option>
                        <option>Außerhalb Einsatzzone (+30 %)</option>
                        <option>Fehlfahrt</option>
                        <option>Wartezeit</option>
                        <option>Probefahrt</option>
                        <option>Tank / Maut / AdBlue</option>
                      </select>
                    </Field>
                    <Field label="Extra Preis">
                      <input value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} className={inputCls} />
                    </Field>
                    <label className="md:col-span-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <input type="checkbox" checked={redPlate} onChange={(e) => setRedPlate(e.target.checked)} />
                      Rotes Kennzeichen (+50 €)
                    </label>
                    <div className="md:col-span-2 flex gap-3">
                      <button onClick={handleRouteCalculation} className={btnDark}>LKW Route berechnen</button>
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Paket">
                      <select value={cleanPackage} onChange={(e) => setCleanPackage(e.target.value)} className={inputCls}>
                        {Object.keys(CLEANING_LABELS).map((pkg) => (
                          <option key={pkg} value={pkg}>{CLEANING_LABELS[pkg]}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Sonderarbeit Stunden">
                      <input value={specialHours} onChange={(e) => setSpecialHours(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Zusatzpreis">
                      <input value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} className={inputCls} />
                    </Field>
                    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <input type="checkbox" checked={fuelService} onChange={(e) => setFuelService(e.target.checked)} />
                      Betankung (+22 €)
                    </label>
                  </>
                )}

                <Field label="Fahrer / SUB">
                  <select value={driver} onChange={(e) => setDriver(e.target.value)} className={inputCls}>
                    {SUB_DRIVERS.map((sub) => <option key={sub}>{sub}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                    <option>Neu</option>
                    <option>Geplant</option>
                    <option>Unterwegs</option>
                    <option>Erledigt</option>
                  </select>
                </Field>
                <Field label="Datum" span="md:col-span-2">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Hinweise / Kommentare" span="md:col-span-2">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="z.B. Kunde wartet vor Ort, Fahrzeug steht hinter Halle 3, Schlüssel in Infothek…" className="h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </Field>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">Preisvorschau</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Row label="Grundpreis" value={money(summary.base)} />
                  <Row label="Fahrt / Paket" value={money(summary.tripAdjusted)} />
                  <Row label="Zone 9 extra" value={money(summary.extraKmPrice)} />
                  <Row label="Auto Zuschlag" value={money(summary.optionAuto)} />
                  <Row label="Betankung" value={money(summary.fuel)} />
                  <Row label="Sonderarbeit" value={money(summary.specialWork)} />
                  <Row label="Rotes Kennzeichen" value={money(summary.redPlate)} />
                  <Row label="Zusatzpreis" value={money(summary.manualExtra)} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-lg font-bold text-red-700">
                  <span>Gesamtpreis</span>
                  <span>{money(summary.total)}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={handleCreateOrder} className={btnRed}>Auftrag speichern</button>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel right={<div className="text-sm text-slate-500">Saubere Kartenansicht ohne Überschneidung</div>} titleArea={
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-bold">Aktuelle Aufträge</h2>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche: Kennzeichen, Repco, Auftrag, Fahrer..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm md:w-80" />
              </div>
            }>
              <div className="grid gap-3">
                {visibleOrders.map((order) => (
                  <div key={order.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr]">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-800">{order.id}</div>
                        <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${departmentBadge(order.department)}`}>{shortDepartment(order.department)}</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">Repco: {order.repco}</div>
                      {order.notes ? <div className="mt-2 text-xs text-slate-500">Hinweis: {order.notes}</div> : null}
                      <div className="text-sm text-slate-600">Kennzeichen: {order.plate}</div>
                      <div className="text-sm text-slate-600">Fahrzeug: {order.vehicleType} · {order.vehicleClass}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-slate-400">Ort / Route</div>
                      {order.department === "Aufbereitung" ? (
                        <>
                          <div className="mt-1 font-medium text-slate-700">{order.parking}</div>
                          <div className="mt-1 text-sm text-slate-500">Parkplatz</div>
                        </>
                      ) : (
                        <>
                          <div className="mt-1 font-medium text-slate-700">{order.from}</div>
                          <div className="mt-1 text-sm text-slate-500">→ {order.to}</div>
                        </>
                      )}
                      <div className="mt-2 text-xs uppercase text-slate-400">Datum</div>
                      <div className="mt-1 text-sm text-slate-600">{order.date}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-slate-400">Leistung</div>
                      <div className="mt-1 text-sm text-slate-700">{order.department === "Aufbereitung" && order.cleanPackage ? CLEANING_LABELS[order.cleanPackage] : order.trip}</div>
                      <div className="mt-2 text-xs uppercase text-slate-400">Extra</div>
                      <div className="mt-1 text-sm text-slate-600">{order.extraOption}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-slate-400">KM / Zone</div>
                      <div className="mt-1 text-sm text-slate-700">{order.km} km · Zone {order.zone}</div>
                      <div className="mt-2 text-xs uppercase text-slate-400">Fahrer</div>
                      <div className="mt-1 text-sm text-slate-600">{order.driver}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-slate-400">Nachweis</div>
                      <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={order.handover} onChange={() => toggleProof(order.id, "handover")} />
                        Fahrzeug übergeben
                      </label>
                      <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={order.delivered} onChange={() => toggleProof(order.id, "delivered")} />
                        Fahrzeug zugestellt
                      </label>
                    </div>

                    <div className="flex flex-col items-start justify-between lg:items-end">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadge(order.status)}`}>{order.status}</span>
                      <div className="mt-4 text-right">
                        <div className="text-xs uppercase text-slate-400">Preis</div>
                        <div className="text-lg font-bold text-slate-800">{canSeeAllPrices ? money(order.price) : "—"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel titleArea={<div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Dispo-Kalender</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Woche</span></div>}>
                <div className="grid gap-3">
                  {dayGroups.map((day) => {
                    const dayOrders = visibleOrders.filter((order) => order.date === day);
                    return (
                      <div key={day} className="rounded-2xl border border-slate-200 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="font-semibold text-slate-800">{day}</div>
                          <div className="text-xs text-slate-500">{dayOrders.length} Aufträge</div>
                        </div>
                        <div className="space-y-2">
                          {dayOrders.map((order) => (
                            <div key={`${order.id}-calendar`} className="rounded-xl bg-slate-50 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium text-slate-800">{order.id}</div>
                                  <div className="mt-1 text-sm text-slate-600">
                                    {order.department === "Aufbereitung" ? `Parkplatz: ${order.parking}` : `${order.from} → ${order.to}`}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {order.department === "Aufbereitung" && order.cleanPackage ? CLEANING_LABELS[order.cleanPackage] : order.trip} · {order.driver}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadge(order.status)}`}>{order.status}</span>
                                  <div className="mt-2 text-sm font-semibold text-slate-800">{money(order.price)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Sammelrechnung Daimler">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold">Daimler Truck AG</div>
                  <div className="mt-1">Leistungszeitraum: {INVOICE_RANGE}</div>
                </div>
                <div className="mt-4 space-y-2">
                  {invoiceLines.map((order) => (
                    <div key={`${order.id}-invoice`} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-xs text-slate-500">{order.repco} · {order.department}</div>
                      </div>
                      <div className="font-semibold">{canSeeAllPrices ? money(order.price) : "—"}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-lg font-bold text-red-700">
                  <span>Gesamt</span>
                  <span>{money(invoiceTotal)}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button className={btnLight}>PDF Sammelrechnung</button>
                  <button className={btnRed}>Rechnung erzeugen</button>
                  <button className={btnLight}>Leistungsnachweis PDF</button>
                  <button className={btnLight}>Rechnung Excel</button>
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="SUB Gutschrift Monat">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold">SUB Wolf</div>
                  <div className="mt-1">Zeitraum: {MONTH_RANGE}</div>
                </div>
                <div className="mt-4 space-y-2">
                  {subMonthlyOrders.map((order) => (
                    <div key={`${order.id}-sub-month`} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-xs text-slate-500">{order.date} · {order.department}</div>
                      </div>
                      <div className="font-semibold">{money(order.price)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-700">
                  <Row label="Fahrten Monat" value={subMonthlyOrders.length} />
                  <Row label="Monatsumsatz" value={money(subMonthlyRevenue)} />
                  <Row label="Gesamt bisher" value={money(subLifetimeRevenue)} />
                  {canSeeInternalSplit ? (
                    <>
                      <Row label="SUB Gutschrift" value={money(subMonthlyPayout)} />
                      <Row label="Hobri Anteil" value={money(hobriMonthlyShare)} />
                    </>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button className={btnLight}>SUB Gutschrift PDF</button>
                  <button className={btnLight}>Monatsübersicht Excel</button>
                </div>
              </Panel>

              <Panel title="Extra Optionen / Aufbereitung">
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="rounded-xl border p-3"><strong>Betankung:</strong> 22 €</div>
                  <div className="rounded-xl border p-3"><strong>Stundensatz:</strong> 45 € / Stunde</div>
                  <div className="rounded-xl border p-3"><strong>Aufbereitung 7,5t–12t:</strong> N1 – Wäsche 47,40 € · N3 – Wäsche Innen 57,40 € · N6 – Wäsche Komplett 145,00 € · N7 – NW1 klein 78,32 € · N9 – Auslieferung 87,12 €</div>
                  <div className="rounded-xl border p-3"><strong>Aufbereitung 12t–18t:</strong> N1 – Wäsche 55,00 € · N3 – Wäsche Innen 69,40 € · N6 – Wäsche Komplett 167,40 € · N7 – NW1 klein 87,12 € · N9 – Auslieferung 94,16 €</div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, right, titleArea, children }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {titleArea ? titleArea : (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children, span = "" }) {
  return (
    <label className={`${span} text-sm`}>
      <div className="mb-1 font-medium">{label}</div>
      {children}
    </label>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between text-sm"><span>{label}</span><span>{value}</span></div>;
}

function CardStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="text-xs uppercase text-red-100">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3";
const btnRed = "rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white";
const btnDark = "rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white";
const btnLight = "rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800";
