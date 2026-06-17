import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a modern font family
Font.register({
  family: 'Inter',
  fonts: [
    // Self-host Inter fonts for maximum reliability in PDF generation
    { src: '/fonts/inter/Inter-VariableFont_opsz,wght.ttfnter-Regular.ttf', fontWeight: 400 },

  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: 'rgb(51, 51, 51)',
    fontFamily: 'Inter',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '2pt solid rgba(15, 159, 202, 0.13)',
    paddingBottom: 20,
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 35, // Numeric value for better compatibility
    marginHorizontal: 'auto',
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: 'rgb(17, 17, 17)',
    letterSpacing: -0.5,
  },
  jobTitle: {
    fontSize: 12,
    color: 'rgb(15, 159, 202)',
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 12,
  },
  contactItem: {
    fontSize: 9,
    color: 'rgb(80, 80, 80)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    gap: 30,
  },
  mainColumn: {
    flex: 2,
  },
  sidebar: {
    flex: 1,
    borderLeft: '1pt solid rgb(238, 238, 238)',
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgb(15, 159, 202)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 15,
  },
  text: {
    lineHeight: 1.5,
    color: 'rgb(68, 68, 68)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    color: 'rgb(17, 17, 17)',
  },
  date: {
    fontSize: 9,
    color: 'rgb(153, 153, 153)',
  },
  company: {
    color: 'rgb(15, 159, 202)',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  skillBadge: {
    fontSize: 9,
    marginBottom: 4,
    fontWeight: 'bold',
  }
});

export default function ResumeDocument({ data }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.profilePic && (
            <Image 
              src={data.profilePic} 
              style={styles.profilePic} 
            />
          )}
          <Text style={styles.name}>{`${data.firstName || "Your"} ${data.lastName || "Name"}`}</Text>
          <Text style={styles.jobTitle}>{data.jobTitle || ""}</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactItem}>{data.email || ""}</Text>
            {data.phone && <Text style={styles.contactItem}>{data.phone || ""}</Text>}
            {data.location && <Text style={styles.contactItem}>{data.location || ""}</Text>}
          </View>
          <View style={[styles.contactRow, { marginTop: 4 }]}>
            {data.linkedIn && <Text style={styles.contactItem}>{data.linkedIn}</Text>}
            {data.github && <Text style={styles.contactItem}>{data.github}</Text>}
            {data.portfolio && <Text style={styles.contactItem}>{data.portfolio}</Text>}
          </View>
        </View>

        <View style={styles.body}>
          {/* Main Content */}
          <View style={styles.mainColumn}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Text style={styles.text}>{data.summary || ""}</Text>

            <Text style={styles.sectionTitle}>Experience</Text>
            {(data.experience || []).map((exp, i) => (
              <View key={i} style={{ marginBottom: 12 }} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.role || ""}</Text>
                  <Text style={styles.date}>{exp.startDate || ""} - {exp.isCurrent ? 'Present' : (exp.endDate || "")}</Text>
                </View>
                <Text style={styles.company}>{exp.company || ""}</Text>
                <Text style={[styles.text, { fontSize: 9 }]}>{exp.description || ""}</Text>
              </View>
            ))}

            {data.projects && data.projects.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Projects</Text>
                {(data.projects || []).map((proj, i) => (
                  <View key={i} style={{ marginBottom: 10 }} wrap={false}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{proj.title || ""}</Text>
                      {proj.link && <Text style={styles.date}>{proj.link}</Text>}
                    </View>
                    <Text style={[styles.text, { fontSize: 9 }]}>{proj.description || ""}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Sidebar */}
          <View style={styles.sidebar}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {(data.skills || []).map((skill, i) => (
              <Text key={i} style={styles.skillBadge}>• {skill || ""}</Text>
            ))}

            {data.certifications && data.certifications.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {(data.certifications || []).map((cert, i) => (
                  <View key={i} style={{ marginBottom: 8 }} wrap={false}>
                    <Text style={[styles.itemTitle, { fontSize: 9 }]}>{cert.name || ""}</Text>
                    <Text style={styles.company}>{cert.issuer || ""}</Text>
                  </View>
                ))}
              </>
            )}

            <Text style={styles.sectionTitle}>Education</Text>
            {(data.education || []).map((edu, i) => (
              <View key={i} style={{ marginBottom: 10 }} wrap={false}>
                <Text style={styles.itemTitle}>{edu.degree || ""}</Text>
                <Text style={styles.company}>{edu.school || ""}</Text>
              </View>
            ))}

            {(data.customSections || []).map((sec, i) => (
              sec.title && (
                <View key={i} style={{ marginBottom: 15 }}>
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                  <Text style={[styles.text, { fontSize: 9 }]}>{sec.description || ""}</Text>
                </View>
              )
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}