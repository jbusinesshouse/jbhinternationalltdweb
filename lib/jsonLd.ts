/**
 * Serialize JSON-LD for an inline <script>. JSON.stringify alone is NOT safe here: a value
 * containing "</script>" (e.g. a seller-written product name) would close the tag and run
 * whatever follows. Escaping "<", ">" and "&" keeps the JSON identical but inert in HTML.
 */
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEP]: "\\u2028",
  [PARA_SEP]: "\\u2029",
};

const UNSAFE = new RegExp(`[<>&${LINE_SEP}${PARA_SEP}]`, "g");

export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, (ch) => ESCAPES[ch]);
}
