import type { PersonalInfo, SocialLink } from "@/types/portfolio";
import { useState } from "react";
import { FileText } from "lucide-react";
import { Field, inputStyle, cardStyle, Toggle } from "../components/AdminUI";

interface Props {
  personalInfo: PersonalInfo;
  socialLinks: SocialLink[];
  onChange: (p: PersonalInfo, s: SocialLink[]) => void;
  onUploadResume: (file: File) => Promise<void>;
}

export function PersonalInfoEditor({ personalInfo, socialLinks, onChange, onUploadResume }: Props) {
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState("");
  const set = (partial: Partial<PersonalInfo>) =>
    onChange({ ...personalInfo, ...partial }, socialLinks);

  const uploadResume = async (file: File) => {
    setResumeUploadError("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setResumeUploadError("Choose a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeUploadError("The PDF must be 10 MB or smaller.");
      return;
    }

    setUploadingResume(true);
    try {
      await onUploadResume(file);
    } catch (error) {
      setResumeUploadError(error instanceof Error ? error.message : "Failed to upload resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const setSocial = (idx: number, partial: Partial<SocialLink>) => {
    const next = socialLinks.map((s, i) => (i === idx ? { ...s, ...partial } : s));
    onChange(personalInfo, next);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Personal Info</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name">
          <input
            style={inputStyle}
            value={personalInfo.firstName}
            onChange={(e) => set({ firstName: e.target.value, name: `${e.target.value} ${personalInfo.lastName}` })}
          />
        </Field>
        <Field label="Last Name">
          <input
            style={inputStyle}
            value={personalInfo.lastName}
            onChange={(e) => set({ lastName: e.target.value, name: `${personalInfo.firstName} ${e.target.value}` })}
          />
        </Field>
      </div>

      <Field label="Tagline">
        <input style={inputStyle} value={personalInfo.tagline} onChange={(e) => set({ tagline: e.target.value })} />
      </Field>

      <div style={{ marginBottom: 16 }}>
        <Toggle checked={personalInfo.showTagline} onChange={(v) => set({ showTagline: v })} label="Show tagline" />
      </div>

      <Field label="Location">
        <input style={inputStyle} value={personalInfo.location} onChange={(e) => set({ location: e.target.value })} />
      </Field>

      <Field label="Bio">
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          value={personalInfo.bio}
          onChange={(e) => set({ bio: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Avatar (front)">
          <input style={inputStyle} value={personalInfo.avatarUrl} onChange={(e) => set({ avatarUrl: e.target.value })} />
        </Field>
        <Field label="Avatar (back / dark mode)">
          <input style={inputStyle} value={personalInfo.avatarBackUrl ?? ""} onChange={(e) => set({ avatarBackUrl: e.target.value })} />
        </Field>
      </div>

      <Field label="Resume URL">
        <input
          style={inputStyle}
          placeholder="https://example.com/resume.pdf or /files/resume.pdf"
          value={personalInfo.resumeUrl ?? ""}
          onChange={(e) => set({ resumeUrl: e.target.value })}
        />
      </Field>

      <Field label="Or upload a resume PDF">
        <label
          className="flex items-center gap-3 cursor-pointer"
          style={{
            ...inputStyle,
            minHeight: 48,
            borderStyle: "dashed",
            opacity: uploadingResume ? 0.6 : 1,
          }}
        >
          <FileText size={16} color="var(--adm-fg-subtle)" />
          <span style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>
            {uploadingResume
              ? "Uploading resume…"
              : personalInfo.resumeUrl
                ? "Choose a new PDF to replace the current resume"
                : "Choose a PDF file (10 MB max)"}
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={uploadingResume}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadResume(file);
              event.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
        {resumeUploadError && (
          <p role="alert" style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>
            {resumeUploadError}
          </p>
        )}
        <p style={{ color: "var(--adm-fg-subtle)", fontSize: 12, marginTop: 8 }}>
          The uploaded file is saved to your project. Click Save to publish its URL.
        </p>
      </Field>

      {/* Social Links */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Social Links</h3>
      {socialLinks.map((s, i) => (
        <div key={i} style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{s.platform}</span>
            <Toggle checked={s.isVisible} onChange={(v) => setSocial(i, { isVisible: v })} label="Visible" />
          </div>
          <Field label="URL">
            <input style={inputStyle} value={s.url} onChange={(e) => setSocial(i, { url: e.target.value })} />
          </Field>
        </div>
      ))}
    </div>
  );
}
