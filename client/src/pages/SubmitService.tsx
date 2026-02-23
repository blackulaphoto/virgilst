import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SubmissionCategory =
  | "resource"
  | "treatment_center"
  | "recovery_meeting"
  | "medi_cal_provider"
  | "community_event";

const categoryOptions: Array<{ key: SubmissionCategory; label: string; description: string }> = [
  { key: "resource", label: "Resources", description: "Food, shelter, legal, transportation, or other support services." },
  { key: "treatment_center", label: "Treatment Centers", description: "Detox, residential, outpatient, or sober living programs." },
  { key: "recovery_meeting", label: "Recovery Meetings", description: "AA, NA, CMA, SMART, and other recovery meetings." },
  { key: "medi_cal_provider", label: "Medi-Cal Providers", description: "Clinics, doctors, and providers accepting Medi-Cal." },
  { key: "community_event", label: "Community Events", description: "Resource fairs, workshops, and support events." },
];

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

export default function SubmitService() {
  const { category } = useParams<{ category?: SubmissionCategory }>();
  const selectedCategory = categoryOptions.some(option => option.key === category) ? category : undefined;
  const createMutation = trpc.serviceSubmissions.create.useMutation({
    onSuccess: () => {
      toast.success("Submission received. Our team will review it before publishing.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit service.");
    },
  });

  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [website, setWebsite] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const setField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAddress("");
    setCity("");
    setZipCode("");
    setWebsite("");
    setFormData({});
  };

  const selectedLabel = useMemo(
    () => categoryOptions.find(option => option.key === selectedCategory)?.label ?? "Service",
    [selectedCategory]
  );

  const submit = () => {
    if (!selectedCategory) return;
    if (!title.trim() || !submitterName.trim() || !submitterEmail.trim()) {
      toast.error("Please fill out name, email, and listing name.");
      return;
    }

    if (selectedCategory === "resource") {
      createMutation.mutate({
        category: "resource",
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        website: website.trim() || undefined,
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        submitterPhone: submitterPhone.trim() || undefined,
        data: {
          resourceType: (formData.resourceType as any) || "other",
          hours: formData.hours || undefined,
          filters: formData.filters ? splitCsv(formData.filters) : undefined,
          phone: formData.contactPhone || undefined,
        },
      });
      return;
    }

    if (selectedCategory === "treatment_center") {
      createMutation.mutate({
        category: "treatment_center",
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        website: website.trim() || undefined,
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        submitterPhone: submitterPhone.trim() || undefined,
        data: {
          type: (formData.type as any) || "outpatient",
          servesPopulation: (formData.servesPopulation as any) || "coed",
          acceptsCouples: formData.acceptsCouples === "yes",
          acceptsMediCal: formData.acceptsMediCal === "yes",
          acceptsMedicare: formData.acceptsMedicare === "yes",
          acceptsPrivateInsurance: formData.acceptsPrivateInsurance === "yes",
          acceptsRBH: formData.acceptsRBH === "yes",
          isJointCommission: formData.isJointCommission === "yes",
          priceRange: formData.priceRange || undefined,
          servicesOffered: formData.servicesOffered ? splitCsv(formData.servicesOffered) : undefined,
          amenities: formData.amenities ? splitCsv(formData.amenities) : undefined,
          phone: formData.contactPhone || undefined,
        },
      });
      return;
    }

    if (selectedCategory === "recovery_meeting") {
      createMutation.mutate({
        category: "recovery_meeting",
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        website: website.trim() || undefined,
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        submitterPhone: submitterPhone.trim() || undefined,
        data: {
          meetingType: (formData.meetingType as any) || "aa",
          dayOfWeek: (formData.dayOfWeek as any) || "monday",
          time: formData.time || "7:00 PM",
          format: formData.format || "discussion",
          meetingMode: (formData.meetingMode as any) || "in_person",
          duration: formData.duration ? Number(formData.duration) : undefined,
          venueName: formData.venueName || undefined,
          zoomId: formData.zoomId || undefined,
          zoomPassword: formData.zoomPassword || undefined,
          language: formData.language || undefined,
          tags: formData.tags ? splitCsv(formData.tags) : undefined,
          notes: formData.notes || undefined,
          phone: formData.contactPhone || undefined,
        },
      });
      return;
    }

    if (selectedCategory === "medi_cal_provider") {
      createMutation.mutate({
        category: "medi_cal_provider",
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        website: website.trim() || undefined,
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        submitterPhone: submitterPhone.trim() || undefined,
        data: {
          facilityName: formData.facilityName || undefined,
          npi: formData.npi || undefined,
          stateLicense: formData.stateLicense || undefined,
          state: formData.state || undefined,
          phone: formData.contactPhone || undefined,
          specialties: formData.specialties || undefined,
          languagesSpoken: formData.languagesSpoken || undefined,
          gender: formData.gender || undefined,
          networks: formData.networks || undefined,
          hospitalAffiliations: formData.hospitalAffiliations || undefined,
          medicalGroups: formData.medicalGroups || undefined,
        },
      });
      return;
    }

    createMutation.mutate({
      category: "community_event",
      title: title.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      website: website.trim() || undefined,
      submitterName: submitterName.trim(),
      submitterEmail: submitterEmail.trim(),
      submitterPhone: submitterPhone.trim() || undefined,
      data: {
        eventType: formData.eventType || "community_event",
        category: formData.eventCategory || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        isRecurring: formData.isRecurring === "yes",
        venueName: formData.venueName || undefined,
        isOnline: formData.isOnline === "yes",
        onlineUrl: formData.onlineUrl || undefined,
        registrationUrl: formData.registrationUrl || undefined,
        servicesOffered: formData.servicesOffered ? splitCsv(formData.servicesOffered) : undefined,
        tags: formData.tags ? splitCsv(formData.tags) : undefined,
        eligibility: formData.eligibility || undefined,
        registrationRequired: formData.registrationRequired === "yes",
        cost: formData.cost || undefined,
        organizerName: formData.organizerName || undefined,
      },
    });
  };

  const isSubmitting = createMutation.isPending;

  return (
    <PublicLayout
      title="Submit a Service"
      subtitle="Help expand verified listings. Every submission is reviewed by admins before it goes live."
      actions={
        <Link href="/">
          <Button variant="outline" size="sm">Back home</Button>
        </Link>
      }
    >
      <SectionBlock>
        {!selectedCategory ? (
          <div className="grid gap-4 md:grid-cols-2">
            {categoryOptions.map(option => (
              <Link key={option.key} href={`/submit-service/${option.key}`}>
                <Card className="surface-card cursor-pointer transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{option.label}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="surface-card">
            <CardHeader>
              <CardTitle>Submit {selectedLabel}</CardTitle>
              <CardDescription>Required fields are listed first. Include as much detail as possible for faster approval.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Contact Name *</Label>
                  <Input value={submitterName} onChange={e => setSubmitterName(e.target.value)} />
                </div>
                <div>
                  <Label>Contact Email *</Label>
                  <Input type="email" value={submitterEmail} onChange={e => setSubmitterEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input value={submitterPhone} onChange={e => setSubmitterPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Listing Name *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <Label>Zip Code</Label>
                  <Input value={zipCode} onChange={e => setZipCode(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
              </div>

              {selectedCategory === "resource" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Resource Type</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.resourceType || "other"} onChange={e => setField("resourceType", e.target.value)}>
                      {["shelter", "food", "medical", "legal", "employment", "clothing", "hygiene", "housing", "transportation", "other"].map(type => (
                        <option key={type} value={type}>{type.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Resource Phone</Label>
                    <Input value={formData.contactPhone || ""} onChange={e => setField("contactPhone", e.target.value)} />
                  </div>
                  <div>
                    <Label>Hours</Label>
                    <Input value={formData.hours || ""} onChange={e => setField("hours", e.target.value)} />
                  </div>
                  <div>
                    <Label>Flags (comma-separated)</Label>
                    <Input placeholder="wheelchair_accessible, accepts_ebt" value={formData.filters || ""} onChange={e => setField("filters", e.target.value)} />
                  </div>
                </div>
              )}

              {selectedCategory === "treatment_center" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Treatment Type</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.type || "outpatient"} onChange={e => setField("type", e.target.value)}>
                      {["sober_living", "detox", "residential", "outpatient", "iop_php", "dual_diagnosis"].map(type => (
                        <option key={type} value={type}>{type.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Population Served</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.servesPopulation || "coed"} onChange={e => setField("servesPopulation", e.target.value)}>
                      {["men", "women", "coed", "lgbtq", "women_with_children"].map(type => (
                        <option key={type} value={type}>{type.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.contactPhone || ""} onChange={e => setField("contactPhone", e.target.value)} />
                  </div>
                  <div>
                    <Label>Price Range</Label>
                    <Input value={formData.priceRange || ""} onChange={e => setField("priceRange", e.target.value)} />
                  </div>
                  {["acceptsMediCal", "acceptsPrivateInsurance", "acceptsMedicare", "acceptsCouples", "acceptsRBH", "isJointCommission"].map(flag => (
                    <div key={flag}>
                      <Label>{flag.replace(/([A-Z])/g, " $1").trim()}</Label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData[flag] || "no"} onChange={e => setField(flag, e.target.value)}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <Label>Services Offered (comma-separated)</Label>
                    <Input value={formData.servicesOffered || ""} onChange={e => setField("servicesOffered", e.target.value)} />
                  </div>
                </div>
              )}

              {selectedCategory === "recovery_meeting" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Program</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.meetingType || "aa"} onChange={e => setField("meetingType", e.target.value)}>
                      {["aa", "na", "cma", "smart"].map(type => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Day of Week</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.dayOfWeek || "monday"} onChange={e => setField("dayOfWeek", e.target.value)}>
                      {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Time *</Label>
                    <Input value={formData.time || ""} onChange={e => setField("time", e.target.value)} />
                  </div>
                  <div>
                    <Label>Format *</Label>
                    <Input placeholder="discussion, speaker, step study..." value={formData.format || ""} onChange={e => setField("format", e.target.value)} />
                  </div>
                  <div>
                    <Label>Meeting Mode</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.meetingMode || "in_person"} onChange={e => setField("meetingMode", e.target.value)}>
                      {["in_person", "online", "hybrid"].map(mode => <option key={mode} value={mode}>{mode.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Venue Name</Label>
                    <Input value={formData.venueName || ""} onChange={e => setField("venueName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Meeting Phone</Label>
                    <Input value={formData.contactPhone || ""} onChange={e => setField("contactPhone", e.target.value)} />
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Input value={formData.language || ""} onChange={e => setField("language", e.target.value)} />
                  </div>
                </div>
              )}

              {selectedCategory === "medi_cal_provider" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Facility Name</Label>
                    <Input value={formData.facilityName || ""} onChange={e => setField("facilityName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Provider Phone</Label>
                    <Input value={formData.contactPhone || ""} onChange={e => setField("contactPhone", e.target.value)} />
                  </div>
                  <div>
                    <Label>NPI</Label>
                    <Input value={formData.npi || ""} onChange={e => setField("npi", e.target.value)} />
                  </div>
                  <div>
                    <Label>State License</Label>
                    <Input value={formData.stateLicense || ""} onChange={e => setField("stateLicense", e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Specialties (comma-separated)</Label>
                    <Input value={formData.specialties || ""} onChange={e => setField("specialties", e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Languages Spoken (comma-separated)</Label>
                    <Input value={formData.languagesSpoken || ""} onChange={e => setField("languagesSpoken", e.target.value)} />
                  </div>
                </div>
              )}

              {selectedCategory === "community_event" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Event Type</Label>
                    <Input value={formData.eventType || ""} onChange={e => setField("eventType", e.target.value)} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={formData.eventCategory || ""} onChange={e => setField("eventCategory", e.target.value)} />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input value={formData.startTime || ""} onChange={e => setField("startTime", e.target.value)} />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input value={formData.endTime || ""} onChange={e => setField("endTime", e.target.value)} />
                  </div>
                  <div>
                    <Label>Online Event?</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.isOnline || "no"} onChange={e => setField("isOnline", e.target.value)}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <Label>Registration Required?</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.registrationRequired || "no"} onChange={e => setField("registrationRequired", e.target.value)}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Clear</Button>
                <Button className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95" onClick={submit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </SectionBlock>
    </PublicLayout>
  );
}
