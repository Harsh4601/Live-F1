export interface TrackMeta {
  length: number
  corners: number
  drsZones: number
  lapRecord: {
    time: string
    driver: string
    year: number
  } | null
  circuitType: 'Street' | 'Permanent'
  firstGP: number
}

export const TRACK_META: Record<string, TrackMeta> = {
  Melbourne:     { length: 5.278, corners: 16, drsZones: 4, lapRecord: { time: '1:20.235', driver: 'C. Leclerc',     year: 2022 }, circuitType: 'Street',    firstGP: 1996 },
  Shanghai:      { length: 5.451, corners: 16, drsZones: 2, lapRecord: { time: '1:32.238', driver: 'M. Schumacher',  year: 2004 }, circuitType: 'Permanent', firstGP: 2004 },
  Suzuka:        { length: 5.807, corners: 18, drsZones: 1, lapRecord: { time: '1:30.983', driver: 'L. Hamilton',    year: 2019 }, circuitType: 'Permanent', firstGP: 1987 },
  Bahrain:       { length: 5.412, corners: 15, drsZones: 3, lapRecord: { time: '1:31.447', driver: 'P. de la Rosa',  year: 2005 }, circuitType: 'Permanent', firstGP: 2004 },
  Jeddah:        { length: 6.174, corners: 27, drsZones: 3, lapRecord: { time: '1:28.882', driver: 'M. Verstappen',  year: 2023 }, circuitType: 'Street',    firstGP: 2021 },
  Miami:         { length: 5.412, corners: 19, drsZones: 3, lapRecord: { time: '1:29.708', driver: 'M. Verstappen',  year: 2023 }, circuitType: 'Street',    firstGP: 2022 },
  Montreal:      { length: 4.361, corners: 14, drsZones: 2, lapRecord: { time: '1:13.078', driver: 'V. Bottas',      year: 2019 }, circuitType: 'Permanent', firstGP: 1978 },
  Monaco:        { length: 3.337, corners: 19, drsZones: 1, lapRecord: { time: '1:12.909', driver: 'L. Hamilton',    year: 2021 }, circuitType: 'Street',    firstGP: 1950 },
  Barcelona:     { length: 4.675, corners: 16, drsZones: 2, lapRecord: { time: '1:16.330', driver: 'M. Verstappen',  year: 2023 }, circuitType: 'Permanent', firstGP: 1991 },
  Austria:       { length: 4.318, corners: 10, drsZones: 3, lapRecord: { time: '1:05.619', driver: 'C. Leclerc',     year: 2020 }, circuitType: 'Permanent', firstGP: 1970 },
  Silverstone:   { length: 5.891, corners: 18, drsZones: 2, lapRecord: { time: '1:27.097', driver: 'M. Verstappen',  year: 2020 }, circuitType: 'Permanent', firstGP: 1950 },
  Spa:           { length: 7.004, corners: 20, drsZones: 2, lapRecord: { time: '1:46.286', driver: 'V. Bottas',      year: 2018 }, circuitType: 'Permanent', firstGP: 1950 },
  Budapest:      { length: 4.381, corners: 14, drsZones: 1, lapRecord: { time: '1:16.627', driver: 'L. Hamilton',    year: 2020 }, circuitType: 'Permanent', firstGP: 1986 },
  Zandvoort:     { length: 4.259, corners: 14, drsZones: 2, lapRecord: { time: '1:11.097', driver: 'M. Verstappen',  year: 2021 }, circuitType: 'Permanent', firstGP: 1952 },
  Monza:         { length: 5.793, corners: 11, drsZones: 2, lapRecord: { time: '1:21.046', driver: 'R. Barrichello', year: 2004 }, circuitType: 'Permanent', firstGP: 1950 },
  Madrid:        { length: 5.476, corners: 20, drsZones: 3, lapRecord: null,                                                        circuitType: 'Permanent', firstGP: 2026 },
  Baku:          { length: 6.003, corners: 20, drsZones: 2, lapRecord: { time: '1:43.009', driver: 'C. Leclerc',     year: 2019 }, circuitType: 'Street',    firstGP: 2016 },
  Singapore:     { length: 5.063, corners: 23, drsZones: 3, lapRecord: { time: '1:35.867', driver: 'L. Hamilton',    year: 2023 }, circuitType: 'Street',    firstGP: 2008 },
  Austin:        { length: 5.513, corners: 20, drsZones: 2, lapRecord: { time: '1:36.169', driver: 'C. Leclerc',     year: 2019 }, circuitType: 'Permanent', firstGP: 2012 },
  'Mexico City': { length: 4.304, corners: 17, drsZones: 3, lapRecord: { time: '1:17.774', driver: 'V. Bottas',      year: 2021 }, circuitType: 'Permanent', firstGP: 1963 },
  'São Paulo':   { length: 4.309, corners: 15, drsZones: 2, lapRecord: { time: '1:10.540', driver: 'V. Bottas',      year: 2018 }, circuitType: 'Permanent', firstGP: 1973 },
  'Las Vegas':   { length: 6.201, corners: 17, drsZones: 3, lapRecord: { time: '1:35.490', driver: 'O. Piastri',     year: 2023 }, circuitType: 'Street',    firstGP: 2023 },
  Qatar:         { length: 5.380, corners: 16, drsZones: 2, lapRecord: { time: '1:24.319', driver: 'M. Verstappen',  year: 2023 }, circuitType: 'Permanent', firstGP: 2021 },
  'Abu Dhabi':   { length: 5.281, corners: 16, drsZones: 2, lapRecord: { time: '1:26.103', driver: 'M. Verstappen',  year: 2021 }, circuitType: 'Permanent', firstGP: 2009 },
}
