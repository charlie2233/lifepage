import type { ReactNode } from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ProfileJSON } from "@/lib/schema";

interface ResumeLink {
  label: string;
  url: string;
}

export interface ResumePdfData {
  name: string;
  headline: string;
  summary: string;
  username?: string | null;
  email?: string | null;
  location?: string | null;
  links: ResumeLink[];
  skills: string[];
  bullets: string[];
  experiences: ProfileJSON["experiences"];
  projects: ProfileJSON["projects"];
  achievements: ProfileJSON["achievements"];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#dbe4f0",
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  headline: {
    fontSize: 11,
    color: "#1d4ed8",
    marginBottom: 8,
  },
  meta: {
    fontSize: 9,
    color: "#475569",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: "#0f172a",
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    color: "#1e293b",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingRight: 8,
  },
  bulletMark: {
    width: 10,
    fontFamily: "Helvetica-Bold",
  },
  bulletText: {
    flex: 1,
  },
  item: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 3,
  },
  itemHeaderTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 9,
    color: "#475569",
    textAlign: "right",
  },
  itemBody: {
    fontSize: 9.5,
    color: "#334155",
    marginBottom: 4,
  },
  tags: {
    fontSize: 9.5,
    color: "#334155",
  },
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 18,
    textAlign: "center",
    fontSize: 8,
    color: "#64748b",
  },
});

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.divider} />
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>-</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (startDate) return `${startDate} - Present`;
  if (endDate) return endDate;
  return "";
}

export function ResumePdfDocument({ resume }: { resume: ResumePdfData }) {
  const metaParts = [
    resume.username ? `@${resume.username}` : null,
    resume.location ?? null,
    resume.email ?? null,
    ...resume.links.map((link) => `${link.label}: ${link.url}`),
  ].filter(Boolean) as string[];

  return (
    <Document
      title={`${resume.name} Resume`}
      author={resume.name}
      subject={resume.headline}
      creator="LifePage"
      producer="LifePage"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{resume.name}</Text>
          <Text style={styles.headline}>{resume.headline}</Text>
          {metaParts.length > 0 && (
            <Text style={styles.meta}>{metaParts.join(" | ")}</Text>
          )}
        </View>

        <Section title="Summary">
          <Text style={styles.paragraph}>{resume.summary}</Text>
        </Section>

        {resume.bullets.length > 0 && (
          <Section title="Selected Impact">
            <BulletList items={resume.bullets} />
          </Section>
        )}

        {resume.experiences.length > 0 && (
          <Section title="Experience">
            {resume.experiences.map((experience, index) => (
              <View key={`${experience.role}-${experience.org}-${index}`} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemHeaderTitle}>
                    {experience.role} | {experience.org}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {formatDateRange(experience.startDate, experience.endDate)}
                  </Text>
                </View>
                {experience.bullets.length > 0 && (
                  <BulletList items={experience.bullets} />
                )}
              </View>
            ))}
          </Section>
        )}

        {resume.projects.length > 0 && (
          <Section title="Projects">
            {resume.projects.map((project, index) => {
              const description =
                project.impact ?? project.approach ?? project.problem ?? "";
              const techSummary = project.tech.length > 0
                ? `Tech: ${project.tech.join(", ")}`
                : null;
              const linkSummary = project.links.length > 0
                ? project.links
                    .map((link) => `${link.label}: ${link.url}`)
                    .join(" | ")
                : null;

              return (
                <View key={`${project.title}-${index}`} style={styles.item}>
                  <Text style={styles.itemTitle}>{project.title}</Text>
                  {description && (
                    <Text style={styles.itemBody}>{description}</Text>
                  )}
                  {techSummary && <Text style={styles.tags}>{techSummary}</Text>}
                  {linkSummary && <Text style={styles.tags}>{linkSummary}</Text>}
                </View>
              );
            })}
          </Section>
        )}

        {resume.skills.length > 0 && (
          <Section title="Skills">
            <Text style={styles.paragraph}>{resume.skills.join(", ")}</Text>
          </Section>
        )}

        {resume.achievements.length > 0 && (
          <Section title="Achievements">
            {resume.achievements.map((achievement, index) => {
              const details = [
                achievement.context,
                achievement.date,
                achievement.proof,
              ].filter(Boolean).join(" | ");

              return (
                <View key={`${achievement.title}-${index}`} style={styles.item}>
                  <Text style={styles.itemTitle}>{achievement.title}</Text>
                  {details && <Text style={styles.itemBody}>{details}</Text>}
                </View>
              );
            })}
          </Section>
        )}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${resume.name} Resume | ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
