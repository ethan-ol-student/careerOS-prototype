import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ResumeData } from "./data";

/**
 * One clean, single-column resume template rendered server-side.
 *
 * Living-Portfolio angle: when `problemsSolved` exist (mid-career), a
 * "Selected problems solved" section leads the document — proof of
 * capability before job titles.
 */
const s = StyleSheet.create({
  page: { padding: 42, fontSize: 10, color: "#1a1a1a", fontFamily: "Helvetica" },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  headline: { fontSize: 11, color: "#333", marginTop: 3 },
  contact: { fontSize: 9, color: "#666", marginTop: 3 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#4d7aff",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  row: { marginBottom: 8 },
  rowTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  rowMeta: { fontSize: 9, color: "#666", marginTop: 1 },
  body: { fontSize: 9.5, color: "#333", marginTop: 2, lineHeight: 1.4 },
  bullet: { fontSize: 9.5, color: "#333", marginBottom: 3, lineHeight: 1.4 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    fontSize: 9,
    color: "#1a1a1a",
    backgroundColor: "#eef2ff",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
  },
});

function ResumeDocument({ d }: { d: ResumeData }) {
  return (
    <Document title={`${d.name} — Resume`} author="Career OS">
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{d.name}</Text>
        {d.headline ? <Text style={s.headline}>{d.headline}</Text> : null}
        <Text style={s.contact}>
          {[d.email, d.field, d.targetJob && `Target: ${d.targetJob}`]
            .filter(Boolean)
            .join("  ·  ")}
        </Text>

        {d.summary ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text style={s.body}>{d.summary}</Text>
          </View>
        ) : null}

        {d.problemsSolved.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Selected problems solved</Text>
            {d.problemsSolved.map((p, i) => (
              <Text key={i} style={s.bullet}>
                •  {p}
              </Text>
            ))}
          </View>
        ) : null}

        {d.experiences.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Experience</Text>
            {d.experiences.map((e, i) => (
              <View key={i} style={s.row}>
                <Text style={s.rowTitle}>{e.role}</Text>
                <Text style={s.rowMeta}>
                  {e.company}  ·  {e.period}
                </Text>
                {e.detail ? <Text style={s.body}>{e.detail}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {d.skills.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.chips}>
              {d.skills.map((skill, i) => (
                <Text key={i} style={s.chip}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {d.projects.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Projects</Text>
            {d.projects.map((p, i) => (
              <View key={i} style={s.row}>
                <Text style={s.rowTitle}>{p.title}</Text>
                <Text style={s.body}>{p.description}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {d.certificates.length > 0 || d.awards.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Certifications & awards</Text>
            {d.certificates.map((c, i) => (
              <Text key={`c${i}`} style={s.bullet}>
                •  {c.title} — {c.issuer} ({c.year})
              </Text>
            ))}
            {d.awards.map((a, i) => (
              <Text key={`a${i}`} style={s.bullet}>
                •  {a.title} ({a.year}){a.description ? ` — ${a.description}` : ""}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

/** Render the resume PDF to a Buffer (Node runtime route handlers). */
export function renderResumeBuffer(d: ResumeData): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument d={d} />);
}
