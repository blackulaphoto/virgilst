import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Phone, Building2 } from "lucide-react";
import { Link } from "wouter";

type WizardStep = {
  id: string;
  question: string;
  description?: string;
  type: "radio" | "checkbox";
  options: { value: string; label: string }[];
};

const wizardSteps: WizardStep[] = [
  {
    id: "county",
    question: "Which county are you looking for treatment in?",
    description: "We'll show you facilities in your area",
    type: "radio",
    options: [
      { value: "Los Angeles", label: "Los Angeles County" },
      { value: "Orange", label: "Orange County" },
      { value: "San Diego", label: "San Diego County" },
      { value: "Riverside", label: "Riverside County" },
      { value: "Ventura", label: "Ventura County" },
      { value: "any", label: "Any County" },
    ],
  },
  {
    id: "insurance",
    question: "What insurance do you have?",
    description: "This helps us find facilities you can afford",
    type: "radio",
    options: [
      { value: "medi-cal", label: "Medi-Cal / Medicaid" },
      { value: "private", label: "Private Insurance" },
      { value: "none", label: "No Insurance / Self-Pay" },
      { value: "any", label: "Any (I'll figure it out later)" },
    ],
  },
  {
    id: "type",
    question: "What type of treatment are you looking for?",
    description: "Different programs offer different levels of care",
    type: "radio",
    options: [
      { value: "residential", label: "Residential / Inpatient (live-in treatment)" },
      { value: "outpatient", label: "Outpatient (visit for sessions)" },
      { value: "sober_living", label: "Sober Living (structured housing)" },
      { value: "detox", label: "Detox (medical withdrawal management)" },
      { value: "any", label: "Any Type" },
    ],
  },
  {
    id: "couples",
    question: "Do you need a facility that accepts couples?",
    description: "Most facilities are gender-specific, but some work with couples",
    type: "radio",
    options: [
      { value: "yes", label: "Yes, I need couples treatment" },
      { value: "no", label: "No, individual treatment is fine" },
    ],
  },
];

export default function TreatmentWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const recommendationQuery = trpc.treatmentCenters.getRecommendations.useQuery(
    {
      county: answers.county === "any" ? undefined : answers.county,
      acceptsMediCal: answers.insurance === "medi-cal" ? true : undefined,
      type: answers.type === "any" ? undefined : (answers.type as any),
      acceptsCouples: answers.couples === "yes" ? true : undefined,
    },
    { enabled: showResults }
  );

  const currentStepData = wizardSteps[currentStep];
  const isLastStep = currentStep === wizardSteps.length - 1;
  const canGoNext = answers[currentStepData?.id];

  const handleAnswer = (stepId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  };

  const handleNext = () => {
    if (isLastStep) {
      setShowResults(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <Link href="/treatment">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Treatment Directory
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-8 h-8 text-amber-500" />
              <h1 className="text-3xl font-bold">Your Top Matches</h1>
            </div>
            <p className="text-zinc-400">
              Based on your answers, here are the best treatment facilities for you:
            </p>
          </div>

          {recommendationQuery.isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-zinc-400">Finding the best matches for you...</p>
            </div>
          )}

          {recommendationQuery.data && recommendationQuery.data.length === 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-400 mb-4">
                  We couldn't find facilities that match all your criteria.
                </p>
                <p className="text-zinc-500 text-sm mb-6">
                  Try adjusting your search or browse all facilities in the treatment directory.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleRestart} variant="outline">
                    Start Over
                  </Button>
                  <Link href="/treatment">
                    <Button>Browse All Facilities</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {recommendationQuery.data && recommendationQuery.data.length > 0 && (
            <div className="space-y-6">
              {recommendationQuery.data.map((facility, index) => (
                <Card key={facility.id} className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-amber-500 text-black font-bold px-3 py-1 rounded text-sm">
                            #{index + 1} Match
                          </span>
                          {facility.acceptsMediCal && (
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                              Accepts Medi-Cal
                            </span>
                          )}
                          {facility.acceptsCouples && (
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                              Accepts Couples
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl text-zinc-100">{facility.name}</CardTitle>
                        <CardDescription className="text-zinc-400 capitalize">
                          {facility.type.replace(/_/g, " ")} • {facility.city || 'California'}
                        </CardDescription>
                      </div>
                      <Building2 className="w-8 h-8 text-amber-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {facility.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                          <span className="text-zinc-300">{facility.address}</span>
                        </div>
                      )}
                      {facility.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          <a href={`tel:${facility.phone}`} className="text-amber-500 hover:underline">
                            {facility.phone}
                          </a>
                        </div>
                      )}
                      {facility.servicesOffered && (
                        <div className="text-sm">
                          <span className="text-zinc-500">Services: </span>
                          <span className="text-zinc-300">{facility.servicesOffered}</span>
                        </div>
                      )}
                      {facility.description && (
                        <div className="text-sm text-zinc-400 bg-zinc-800/50 p-3 rounded">
                          {facility.description}
                        </div>
                      )}
                      <div className="flex gap-3 pt-4">
                        {facility.phone && (
                          <a href={`tel:${facility.phone}`} className="flex-1">
                            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black">
                              <Phone className="w-4 h-4 mr-2" />
                              Call Now
                            </Button>
                          </a>
                        )}
                        {facility.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button variant="outline" className="w-full">
                              <MapPin className="w-4 h-4 mr-2" />
                              Get Directions
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex gap-4 justify-center pt-6">
                <Button onClick={handleRestart} variant="outline">
                  Start New Search
                </Button>
                <Link href="/treatment">
                  <Button variant="ghost">Browse All Facilities</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/treatment">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Treatment Directory
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Find Treatment Now</h1>
          <p className="text-zinc-400">
            Answer a few questions and we'll recommend the best facilities for your needs
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {wizardSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded ${
                  index < currentStep
                    ? "bg-amber-500"
                    : index === currentStep
                    ? "bg-amber-500/50"
                    : "bg-zinc-800"
                } ${index > 0 ? "ml-2" : ""}`}
              />
            ))}
          </div>
          <p className="text-sm text-zinc-500 text-center">
            Step {currentStep + 1} of {wizardSteps.length}
          </p>
        </div>

        {/* Question card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl">{currentStepData.question}</CardTitle>
            {currentStepData.description && (
              <CardDescription className="text-zinc-400">{currentStepData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentStepData.id] || ""}
              onValueChange={(value) => handleAnswer(currentStepData.id, value)}
            >
              <div className="space-y-3">
                {currentStepData.options.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      answers[currentStepData.id] === option.value
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-zinc-800 hover:border-zinc-700"
                    }`}
                    onClick={() => handleAnswer(currentStepData.id, option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canGoNext}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
          >
            {isLastStep ? "Find My Matches" : "Next"}
            {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
