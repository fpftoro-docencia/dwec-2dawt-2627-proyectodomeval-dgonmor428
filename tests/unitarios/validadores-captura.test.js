// Tests de los validadores de la captura (js/validadores.js).
// Cada tabla `it.each` tiene casos válidos (con los límites) y un caso no válido por regla, con
// su motivo. Los validadores con comprobación por código (GPS y observatorio) tienen además los
// casos que cumplen la regex pero no la regla del código.
import { describe, it, expect } from 'vitest';
import {
  validarGps,
  validarUrlImagen,
  validarCatalogo,
  validarAscensionRecta,
  validarDeclinacion,
  digitoControlObservatorio,
  validarObservatorio,
  validadores,
  validarNombreUsuario,
  validarCorreo,
  validarClave,
} from '../../js/validadores.js';

const MENSAJE_FORMATO_GPS = 'Usa el formato 36.7213, -4.4214.';
const MENSAJE_RANGO_GPS = 'La latitud va de −90 a 90 y la longitud de −180 a 180.';

describe('validarGps', () => {
  it.each([
    ['36.7213, -4.4214', 'unas coordenadas normales'],
    ['36.7213,-4.4214', 'sin espacio después de la coma'],
    ['90, 180', 'los límites máximos: latitud 90 y longitud 180'],
    ['-90, -180', 'los límites mínimos: latitud −90 y longitud −180'],
    ['0, 0', 'sin decimales'],
    ['-33.8567844, 151.2152967', 'con muchos decimales'],
  ])('«%s» es válido (%s)', (coordenadas) => {
    expect(validarGps(coordenadas)).toBe('');
  });

  it.each([
    ['36,7213, -4,4214', 'usa comas decimales'],
    ['36.7213 -4.4214', 'no tiene coma entre los números'],
    ['36.7213,  -4.4214', 'tiene dos espacios después de la coma'],
    ['36., -4.4214', 'tiene un punto sin decimales'],
    ['1000, 0', 'la latitud tiene más de tres cifras'],
    ['N36.7213, W4.4214', 'usa letras en lugar del signo'],
    ['36.7213', 'solo tiene un número'],
    ['', 'está vacío'],
  ])('«%s» no tiene el formato porque %s', (coordenadas) => {
    expect(validarGps(coordenadas)).toBe(MENSAJE_FORMATO_GPS);
  });

  it.each([
    ['90.0001, 0', 'la latitud pasa de 90'],
    ['-91, 0', 'la latitud baja de −90'],
    ['0, 180.5', 'la longitud pasa de 180'],
    ['0, -181', 'la longitud baja de −180'],
  ])('«%s» tiene el formato pero no el rango porque %s', (coordenadas) => {
    expect(validarGps(coordenadas)).toBe(MENSAJE_RANGO_GPS);
  });
});

describe('validarUrlImagen', () => {
  it.each([
    ['https://ejemplo.es/aurora.jpg', 'una URL con https'],
    ['http://ejemplo.es/aurora.jpg', 'una URL con http'],
    ['HTTPS://EJEMPLO.ES/AURORA.JPG', 'en mayúsculas'],
    [
      'https://fotos.ejemplo.com/2026/via-lactea.png?tam=grande#arriba',
      'con ruta, consulta y fragmento',
    ],
    ['https://ejemplo.es', 'solo el dominio'],
  ])('«%s» es válida (%s)', (url) => {
    expect(validarUrlImagen(url)).toBe('');
  });

  it.each([
    ['ejemplo.es/aurora.jpg', 'no empieza por http:// ni https://'],
    ['ftp://ejemplo.es/aurora.jpg', 'usa otro protocolo'],
    ['https://ejemplo', 'el dominio no tiene punto'],
    ['https://ejemplo.es/mi aurora.jpg', 'tiene un espacio'],
    ['https://', 'no tiene dominio'],
    ['', 'está vacía'],
  ])('«%s» no es válida porque %s', (url) => {
    expect(validarUrlImagen(url)).toBe('Escribe una URL que empiece por http:// o https://.');
  });
});

describe('validarCatalogo', () => {
  it.each([
    ['M1', 'Messier con una cifra'],
    ['M42', 'Messier con dos cifras'],
    ['M110', 'Messier con tres cifras'],
    ['NGC 1976', 'New General Catalogue'],
    ['NGC 7840', 'NGC con cuatro cifras'],
    ['IC 434', 'Index Catalogue'],
  ])('«%s» es válido (%s)', (codigo) => {
    expect(validarCatalogo(codigo)).toBe('');
  });

  it.each([
    ['m42', 'la M está en minúscula'],
    ['M042', 'el número empieza por cero'],
    ['M1000', 'Messier tiene más de tres cifras'],
    ['NGC1976', 'falta el espacio después de NGC'],
    ['NGC 12345', 'NGC tiene más de cuatro cifras'],
    ['IC 0', 'el número es cero'],
    ['ABC 12', 'no es un catálogo conocido'],
    ['', 'está vacío'],
  ])('«%s» no es válido porque %s', (codigo) => {
    expect(validarCatalogo(codigo)).toBe('Usa un código como M42, NGC 1976 o IC 434.');
  });
});

describe('validarAscensionRecta', () => {
  it.each([
    ['05h 35m 17s', 'una ascensión recta normal'],
    ['00h 00m 00s', 'el mínimo'],
    ['23h 59m 59s', 'el máximo'],
    ['05h 35m 17.3s', 'segundos con decimales'],
  ])('«%s» es válida (%s)', (ascension) => {
    expect(validarAscensionRecta(ascension)).toBe('');
  });

  it.each([
    ['24h 00m 00s', 'las horas pasan de 23'],
    ['05h 60m 17s', 'los minutos pasan de 59'],
    ['05h 35m 60s', 'los segundos pasan de 59'],
    ['5h 35m 17s', 'las horas tienen una sola cifra'],
    ['05h35m17s', 'faltan los espacios'],
    ['05:35:17', 'usa dos puntos en lugar de h, m y s'],
    ['', 'está vacía'],
  ])('«%s» no es válida porque %s', (ascension) => {
    expect(validarAscensionRecta(ascension)).toBe('Usa el formato 05h 35m 17s.');
  });
});

describe('validarDeclinacion', () => {
  it.each([
    ['-05° 23′ 28″', 'una declinación normal, con los símbolos de minuto y segundo'],
    ['-05° 23\' 28"', 'con el apóstrofo y las comillas del teclado'],
    ['+41° 16′ 09″', 'con el signo más'],
    ['41° 16′ 09″', 'sin signo'],
    ['+90° 00′ 00″', 'el polo norte del cielo, el máximo'],
    ['-90° 00′ 00″', 'el polo sur del cielo, el mínimo'],
    ['-05° 23′ 28.5″', 'segundos con decimales'],
  ])('«%s» es válida (%s)', (declinacion) => {
    expect(validarDeclinacion(declinacion)).toBe('');
  });

  it.each([
    ['-95° 00′ 00″', 'los grados pasan de 90'],
    ['90° 30′ 00″', 'pasa de 90° por los minutos'],
    ['-05° 60′ 28″', 'los minutos pasan de 59'],
    ['-05° 23′ 60″', 'los segundos pasan de 59'],
    ['-5° 23′ 28″', 'los grados tienen una sola cifra'],
    ['-05 23 28', 'faltan los símbolos'],
    ['', 'está vacía'],
  ])('«%s» no es válida porque %s', (declinacion) => {
    expect(validarDeclinacion(declinacion)).toBe('Usa el formato -05° 23′ 28″.');
  });
});

describe('digitoControlObservatorio', () => {
  it.each([
    ['4821', 7, '4·3 + 8·1 + 2·3 + 1·1 = 27'],
    ['0000', 0, 'todo ceros suma 0'],
    ['9999', 2, '9·3 + 9·1 + 9·3 + 9·1 = 72'],
    ['1000', 3, 'solo cuenta la primera cifra, por 3'],
    ['0100', 1, 'solo cuenta la segunda cifra, por 1'],
  ])('el dígito de control de %s es %i (%s)', (cifras, digito) => {
    expect(digitoControlObservatorio(cifras)).toBe(digito);
  });
});

describe('validarObservatorio', () => {
  it.each([
    ['OBS-4821-7', 'el dígito de control es correcto'],
    ['OBS-0000-0', 'todo ceros'],
    ['OBS-9999-2', 'todo nueves'],
    ['', 'está vacío, y el campo es opcional'],
  ])('«%s» es válido (%s)', (codigo) => {
    expect(validarObservatorio(codigo)).toBe('');
  });

  it.each([
    ['OBS-482-7', 'tiene tres cifras en lugar de cuatro'],
    ['OBS-48210-7', 'tiene cinco cifras'],
    ['obs-4821-7', 'el prefijo está en minúsculas'],
    ['OBS4821-7', 'falta el primer guion'],
    ['OBS-4821', 'falta el dígito de control'],
    ['OBS-48A1-7', 'tiene una letra entre las cifras'],
  ])('«%s» no tiene el formato porque %s', (codigo) => {
    expect(validarObservatorio(codigo)).toBe('Usa el formato OBS-4821-7.');
  });

  it.each([
    ['OBS-4821-3', 'el dígito de control debería ser 7'],
    ['OBS-4812-7', 'las dos últimas cifras están cambiadas de orden (debería ser 5)'],
    ['OBS-0000-1', 'el dígito de control debería ser 0'],
  ])('«%s» tiene el formato pero no el dígito de control porque %s', (codigo) => {
    expect(validarObservatorio(codigo)).toBe('El dígito de control no es correcto.');
  });
});

describe('validadores (el objeto que se usa con data-validar)', () => {
  it.each([
    ['nombreUsuario', validarNombreUsuario],
    ['correo', validarCorreo],
    ['clave', validarClave],
    ['gps', validarGps],
    ['urlImagen', validarUrlImagen],
    ['catalogo', validarCatalogo],
    ['ascensionRecta', validarAscensionRecta],
    ['declinacion', validarDeclinacion],
    ['observatorio', validarObservatorio],
  ])('data-validar="%s" elige su validador', (nombre, validador) => {
    expect(validadores[nombre]).toBe(validador);
  });

  it('solo contiene esos nueve validadores', () => {
    expect(Object.keys(validadores)).toHaveLength(9);
  });

  it('se usa igual con cualquier campo: validadores[nombre](valor)', () => {
    expect(validadores.gps('91, 0')).toBe(MENSAJE_RANGO_GPS);
    expect(validadores.observatorio('OBS-4821-7')).toBe('');
  });
});
