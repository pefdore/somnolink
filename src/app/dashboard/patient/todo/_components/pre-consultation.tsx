// src/app/dashboard/patient/todo/_components/pre-consultation.tsx

"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, Control } from "react-hook-form";
import * as z from "zod";

// Import des composants Shadcn/UI
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from 'lucide-react';

// --- Définition des types ---
type Doctor = { id: string; first_name: string; last_name: string; };
type Appointment = { id: string; } | null;

// --- Utilisation de l'inférence de type Zod pour garantir la compatibilité ---
type FormValues = z.infer<typeof formSchema>;

// --- Schéma de validation Zod complet ---
const formSchema = z.object({
  filling_date: z.string(),
  selected_doctor: z.string().min(1, "Requis"),
  appointment_date: z.string().min(1, "Requis"),
  appointment_time: z.string().min(1, "Requis"),
  family_situation: z.string().optional(),
  profession: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  neck_circumference: z.string().optional(),
  consultation_reasons: z.record(z.string(), z.boolean()).default({}),
  consultation_reason_other: z.string().default(''),
  symptoms: z.record(z.string(), z.object({
    frequency: z.string().optional(),
    comments: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional()
  })).default({}),
  epworth: z.record(z.string(), z.string()).default({}),
  active_sleepiness: z.record(z.string(), z.string()).default({}),
  sleep_habits: z.record(z.string(), z.unknown()).optional(),
  medical_history: z.record(z.string(), z.boolean()).default({}),
  medical_history_other: z.string().default(''),
  current_treatments: z.string().default(''),
  life_habits: z.record(z.string(), z.unknown()).default({}),
  driving_info: z.record(z.string(), z.unknown()).default({}),
  sleep_disorder_history: z.record(z.string(), z.unknown()).default({}),
  free_comments: z.string().default(''),
  consent_signature: z.boolean().default(false),
}).superRefine((data, ctx) => {
    const epworthScores = Object.values(data.epworth);
    const totalEpworthScore = epworthScores.reduce((sum: number, value: unknown) => {
      if (typeof value === 'string') {
        return sum + (parseInt(value, 10) || 0);
      }
      return sum;
    }, 0);
    if (totalEpworthScore > 10 && !data.consent_signature) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['consent_signature'], message: "Votre accord est requis." });
    }
});


const consultationReasonsList: string[] = ['Ronflements importants', 'Sensation de fatigue', 'Somnolence excessive', 'Pauses respiratoires observées', 'Sensation d&apos;étouffement', 'Maux de tête le matin', 'Réveils fréquents pour uriner (Nycturie)', 'Sommeil non réparateur', 'Difficultés de concentration / mémoire', 'Irritabilité / changements d&apos;humeur'];
const medicalHistoryList: string[] = ['Hypertension artérielle', 'Maladie cardiaque', 'Accident vasculaire cérébral &lpar;AVC&rpar;', 'Diabète', 'Maladie respiratoire &lpar;asthme, BPCO&rpar;', 'Maladie neurologique', 'Dépression', 'Anxiété', 'Trouble bipolaire', 'Hypothyroïdie', 'Problèmes rénaux', 'Problèmes hépatiques', 'Anémie', 'Fibromyalgie ou douleurs chroniques'];
const pastTreatmentsList: string[] = ["Appareil à Pression Positive Continue (PPC)", "Orthèse d&apos;Avancée Mandibulaire (OAM)", "Chirurgie", "Médicaments pour la somnolence"];

const stepFields: (keyof FormValues)[][] = [
    ['selected_doctor', 'appointment_date', 'appointment_time'],
    [],
    [],
    ['epworth'],
    [],
    [],
    [],
    [],
    [],
    [],
];

const SymptomRow = ({ control, namePrefix, label, subquestions }: { control: Control<FormValues>, namePrefix: string, label: string, subquestions?: React.ReactNode }) => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-t py-4"><div className="md:col-span-3"><p className="font-medium text-sm text-gray-800">{label}</p>{subquestions && <div className="text-xs text-gray-600 mt-2 space-y-2">{subquestions}</div>}</div><div className="md:col-span-6"><FormField control={control} name={`${namePrefix}.frequency` as keyof FormValues} render={({ field }) => (<FormItem><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''} className="flex justify-around">{['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Toujours'].map(val => (<FormItem key={val} className="flex flex-col items-center space-y-1"><FormControl><RadioGroupItem value={val} id={`${namePrefix}-${val}`} /></FormControl><Label htmlFor={`${namePrefix}-${val}`} className="text-xs">{val}</Label></FormItem>))}</RadioGroup></FormControl></FormItem>)}/></div><div className="md:col-span-3"><FormField control={control} name={`${namePrefix}.comments` as keyof FormValues} render={({ field }) => (<FormItem><FormControl><Input placeholder="Commentaires..." {...field} value={typeof field.value === 'string' ? field.value : ''} /></FormControl></FormItem>)}/></div></div>
);

export function PreConsultation({ patientId, appointment, isDone }: { patientId: string, appointment: Appointment, isDone: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [referralFile, setReferralFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEpworthLocked, setIsEpworthLocked] = useState(false);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    mode: "onTouched",
    defaultValues: {
      filling_date: new Date().toISOString().split('T')[0],
      epworth: {},
      consent_signature: false,
      consultation_reasons: {},
      consultation_reason_other: '',
      symptoms: {},
      active_sleepiness: {},
      medical_history: {},
      medical_history_other: '',
      current_treatments: '',
      life_habits: {},
      driving_info: {},
      sleep_disorder_history: {},
      free_comments: ''
    }
  });
  const { control, trigger } = form;

  const epworthValues = useWatch({ control, name: "epworth" });
  const totalEpworthScore = useMemo(() => {
    if (!epworthValues) return 0;
    const values = Object.values(epworthValues) as string[];
    return values.reduce((sum: number, value: string) => sum + (parseInt(value, 10) || 0), 0);
  }, [epworthValues]);

  const smokingStatus = useWatch({ control, name: "life_habits.smoking_status" });
  const alcoholStatus = useWatch({ control, name: "life_habits.alcohol_status" });
  const hasDrivingLicense = useWatch({ control, name: "driving_info.has_license" });
  const hadPastTreatment = useWatch({ control, name: "sleep_disorder_history.had_treatment" });

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase.from('doctors').select('id, first_name, last_name');
      if (data) setDoctors(data);
    };
    fetchDoctors();
  }, [supabase]);

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };
  const handleLockEpworth = async () => {
    const isValid = await trigger('epworth' as keyof FormValues);
    if (isValid) {
      setIsEpworthLocked(true);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setReferralFile(e.target.files[0]); setFileName(e.target.files[0].name); } };
  // --- FONCTION DE SOUMISSION ACTIVÉE ---
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setMessage('Enregistrement en cours, veuillez patienter...');
    try {
      console.log('Début de la soumission du questionnaire pour le patient:', patientId);
      
      // 1. Upload du fichier (si présent)
      let referralLetterPath = null;
      if (referralFile) {
        console.log('Tentative d\'upload du fichier:', fileName);
        const filePath = `public/${patientId}/${Date.now()}_${fileName}`;
        const { error: uploadError } = await supabase.storage
            .from('patient-documents')
            .upload(filePath, referralFile);
        if (uploadError) {
          console.error('Erreur d&apos;upload:', uploadError);
          throw new Error(`Erreur d'upload: ${uploadError.message}`);
        }
        referralLetterPath = filePath;
        console.log('Fichier uploadé avec succès:', referralLetterPath);
      } else {
        console.log('Aucun fichier à uploader');
      }
      
      // 2. Création/Mise à jour du rendez-vous
      console.log('Création/mise à jour du rendez-vous avec:', values.appointment_date, values.appointment_time);
      const fullAppointmentDate = new Date(`${values.appointment_date}T${values.appointment_time}`);
      const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .upsert({
              id: appointment?.id,
              patient_id: patientId,
              doctor_id: values.selected_doctor,
              appointment_date: fullAppointmentDate.toISOString()
          })
          .select()
          .single();
      if (appointmentError) {
        console.error('Erreur lors de la création du rendez-vous:', appointmentError);
        throw new Error(`Erreur lors de la mise à jour du RDV: ${appointmentError.message}`);
      }
      console.log('Rendez-vous créé/mis à jour avec succès:', appointmentData.id);

      // 3. Préparation des données finales
      const allAnswers = {
          ...values,
          referral_letter_path: referralLetterPath,
          epworth_total: totalEpworthScore
      };
      console.log('Données du questionnaire préparées:', allAnswers);

      // 4. Soumission du questionnaire complet
      console.log('Insertion dans la table questionnaires...');
      const { error: questionnaireError } = await supabase.from('questionnaires').insert({
          patient_id: patientId,
          appointment_id: appointmentData.id,
          type: 'PRE_CONSULTATION_SLEEP_FULL',
          answers: allAnswers,
          submitted_at: new Date().toISOString()
      });
      if (questionnaireError) {
        console.error('Erreur lors de l\'insertion du questionnaire:', questionnaireError);
        throw new Error(`Erreur lors de la soumission du questionnaire: ${questionnaireError.message}`);
      }
      
      // 5. Succès
      console.log('Questionnaire enregistré avec succès !');
      setMessage('Questionnaire enregistré avec succès !');
      router.refresh();

    } catch (error) {
        console.error('Erreur détaillée lors de la soumission du questionnaire:', error);
        setMessage(`Une erreur est survenue : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isDone) { return (<div className="p-6 bg-green-100 text-green-800 rounded-lg"><h2 className="font-bold text-lg">Étape terminée !</h2><p>Merci d&apos;avoir rempli les informations de pré-consultation.</p></div>); }

  const totalSteps = stepFields.length;

  return (
    <div className="p-4 md:p-8 bg-white rounded-lg shadow-2xl max-w-4xl mx-auto"><div className="text-center mb-8"><h2 className="text-2xl font-bold text-gray-800">ÉVALUATION DES TROUBLES DU SOMMEIL</h2><p className="text-sm text-gray-600 mt-2">Étape {currentStep + 1} sur {totalSteps}</p><div className="w-full bg-gray-200 rounded-full h-2.5 mt-4"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}></div></div></div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log('Erreurs de validation détaillées:', JSON.stringify(errors, null, 2));
                console.log('Valeurs actuelles du formulaire:', form.getValues());
            })} className="space-y-10">
                
                {currentStep === 0 && (
                    <fieldset className="space-y-6 p-6 border rounded-lg bg-slate-50"><legend className="font-bold px-2 text-xl text-slate-700">Section 1 : Informations Générales</legend><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><FormField control={control} name="appointment_date" render={({ field }) => (<FormItem><FormLabel>Date du RDV <span className="text-red-500">*</span></FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/><FormField control={control} name="appointment_time" render={({ field }) => (<FormItem><FormLabel>Heure du RDV <span className="text-red-500">*</span></FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/><FormField control={control} name="selected_doctor" render={({ field }) => (<FormItem><FormLabel>Médecin <span className="text-red-500">*</span></FormLabel><Select onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''}><FormControl><SelectTrigger><SelectValue placeholder="-- Choisissez un médecin --" /></SelectTrigger></FormControl><SelectContent>{doctors.map(doc => <SelectItem key={doc.id} value={doc.id}>{doc.first_name} {doc.last_name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/><FormField control={control} name="family_situation" render={({ field }) => (<FormItem><FormLabel>Situation de famille</FormLabel><Select onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''}><FormControl><SelectTrigger><SelectValue placeholder="-- Choisissez --" /></SelectTrigger></FormControl><SelectContent><SelectItem value="seul">Seul(e)</SelectItem><SelectItem value="en_couple">En couple</SelectItem><SelectItem value="autre">Autre</SelectItem></SelectContent></Select></FormItem>)}/></div><FormField control={control} name="profession" render={({ field }) => (<FormItem><FormLabel>Profession actuelle</FormLabel><FormControl><Input placeholder="Précisez si poste de sécurité, conduite, etc." {...field} /></FormControl></FormItem>)}/><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><FormField control={control} name="height" render={({ field }) => (<FormItem><FormLabel>Taille (cm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)}/><FormField control={control} name="weight" render={({ field }) => (<FormItem><FormLabel>Poids (kg)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)}/><FormField control={control} name="neck_circumference" render={({ field }) => (<FormItem><FormLabel>Tour de cou (cm)</FormLabel><FormControl><Input type="number" placeholder="Optionnel" {...field} /></FormControl></FormItem>)}/></div><div><Label htmlFor="referral-file">Courrier d’adressage (optionnel)</Label><Input id="referral-file" type="file" onChange={handleFileChange} className="mt-2" />{fileName && <FormDescription className="mt-2 text-green-600">Fichier sélectionné : {fileName}</FormDescription>}</div></fieldset>
                )}

                {currentStep === 1 && (
                    <fieldset className="space-y-4 p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 2 : Motifs de Consultation</legend><FormDescription>Cochez les raisons principales de votre venue (plusieurs choix possibles).</FormDescription><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">{consultationReasonsList.map(item => (<FormField key={item} control={control} name={`consultation_reasons.${item}`} render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div><FormField control={control} name="consultation_reason_other" render={({ field }) => (<FormItem className="pt-4"><FormLabel>Autre(s) motif(s)</FormLabel><FormControl><Textarea placeholder="Précisez ici..." {...field} /></FormControl></FormItem>)}/></fieldset>
                )}

                {currentStep === 2 && (
                    <fieldset className="p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 3 : Vos Symptômes</legend><SymptomRow control={control} namePrefix="symptoms.snoring" label="Ronflements" subquestions={<><FormField control={control} name="symptoms.snoring.details.partner_confirm" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl><Label>Mon partenaire confirme</Label></FormItem>)}/><FormField control={control} name="symptoms.snoring.details.is_loud" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl><Label>Sont-ils très forts/gênants ?</Label></FormItem>)}/></>}/><SymptomRow control={control} namePrefix="symptoms.breathing_pauses" label="Pauses respiratoires observées" subquestions={<FormField control={control} name="symptoms.breathing_pauses.details.partner_observed" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl><Label>Mon partenaire a observé</Label></FormItem>)}/>}/><SymptomRow control={control} namePrefix="symptoms.choking" label="Sensation d&apos;étouffement/suffocation nocturne" /><SymptomRow control={control} namePrefix="symptoms.headaches" label="Maux de tête matinaux" /><SymptomRow control={control} namePrefix="symptoms.nycturia" label="Réveils nocturnes pour uriner" subquestions={<FormField control={control} name="symptoms.nycturia.details.times_per_night" render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="Combien de fois/nuit ?" {...field} value={typeof field.value === 'string' || typeof field.value === 'number' ? String(field.value) : ''} /></FormControl></FormItem>)}/>}/><SymptomRow control={control} namePrefix="symptoms.non_restorative_sleep" label="Sommeil non réparateur" /><SymptomRow control={control} namePrefix="symptoms.daytime_fatigue" label="Fatigue diurne" /><SymptomRow control={control} namePrefix="symptoms.concentration_memory" label="Difficultés de concentration / mémoire" /><SymptomRow control={control} namePrefix="symptoms.irritability_mood" label="Irritabilité / Humeur dépressive / Anxiété" /></fieldset>
                )}

                {currentStep === 3 && (
                    <fieldset className="space-y-4 p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 4 : Votre Somnolence</legend><div className="bg-blue-50 p-4 rounded-md"><p className="font-semibold">Échelle de Somnolence d&apos;Epworth</p><FormDescription>Pour chaque situation, indiquez votre risque de vous assoupir (0=jamais, 1=faible, 2=moyen, 3=élevé).</FormDescription></div>{[{ name: "epworth.reading", label: "Assis en train de lire" }, { name: "epworth.tv", label: "En regardant la télévision" }, { name: "epworth.public", label: "Assis, inactif dans un lieu public" }, { name: "epworth.passenger", label: "Passager en voiture pendant 1 heure" }, { name: "epworth.lying_down", label: "Allongé pour une sieste" }, { name: "epworth.talking", label: "Assis en train de parler à quelqu&apos;un" }, { name: "epworth.after_lunch", label: "Assis calmement après un déjeuner sans alcool" }, { name: "epworth.in_car", label: "En voiture, à un arrêt (feu, embouteillage)" }].map(item => (<FormField key={item.name} control={control} name={item.name as keyof FormValues} render={({ field }) => (<FormItem className="flex flex-col md:flex-row items-start md:items-center justify-between border-t pt-4"><FormLabel className="mb-2 md:mb-0 pr-4">{item.label}</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''} className="flex space-x-4">{[0,1,2,3].map(val => (<FormItem key={val} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={String(val)} id={`${item.name}-${val}`} disabled={isEpworthLocked} /></FormControl><Label htmlFor={`${item.name}-${val}`}>{val}</Label></FormItem>))}</RadioGroup></FormControl><FormMessage className="mt-2 md:mt-0 md:ml-4 text-red-500" /></FormItem>)}/>))}{!isEpworthLocked ? (<Alert className="mt-6 bg-yellow-50 border-yellow-300"><AlertTitle>Validation de l&apos;échelle</AlertTitle><AlertDescription><p className="mb-4">Une fois cette échelle complétée, veuillez la valider. Vous ne pourrez plus la modifier par la suite.</p><Button type="button" onClick={handleLockEpworth}>Valider définitivement cette grille</Button></AlertDescription></Alert>) : (<Alert variant="default" className="mt-6 bg-green-50 border-green-300"><CheckCircle className="h-4 w-4" /><AlertTitle>Échelle validée &excl;</AlertTitle><AlertDescription>Vous pouvez passer à la section suivante.</AlertDescription></Alert>)}</fieldset>
                )}

                {currentStep === 4 && (
                    <fieldset className="space-y-6 p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 5 : Vos Habitudes de Sommeil</legend><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><FormField control={control} name="sleep_habits.weekday_bedtime" render={({ field }) => (<FormItem><FormLabel>Coucher en semaine</FormLabel><FormControl><Input type="time" {...field} value={typeof field.value === 'string' ? field.value : ''} /></FormControl></FormItem>)}/><FormField control={control} name="sleep_habits.weekday_waketime" render={({ field }) => (<FormItem><FormLabel>Lever en semaine</FormLabel><FormControl><Input type="time" {...field} value={typeof field.value === 'string' ? field.value : ''} /></FormControl></FormItem>)}/><FormField control={control} name="sleep_habits.weekday_hours" render={({ field }) => (<FormItem><FormLabel>Heures / nuit (semaine)</FormLabel><FormControl><Input type="number" placeholder="ex: 7.5" {...field} value={typeof field.value === 'string' || typeof field.value === 'number' ? String(field.value) : ''} /></FormControl></FormItem>)}/></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><FormField control={control} name="sleep_habits.weekend_bedtime" render={({ field }) => (<FormItem><FormLabel>Coucher le week-end</FormLabel><FormControl><Input type="time" {...field} value={typeof field.value === 'string' ? field.value : ''} /></FormControl></FormItem>)}/><FormField control={control} name="sleep_habits.weekend_waketime" render={({ field }) => (<FormItem><FormLabel>Lever le week-end</FormLabel><FormControl><Input type="time" {...field} value={typeof field.value === 'string' ? field.value : ''} /></FormControl></FormItem>)}/><FormField control={control} name="sleep_habits.weekend_hours" render={({ field }) => (<FormItem><FormLabel>Heures / nuit (week-end)</FormLabel><FormControl><Input type="number" {...field} value={typeof field.value === 'string' || typeof field.value === 'number' ? String(field.value) : ''} /></FormControl></FormItem>)}/></div><Separator/><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><FormField control={control} name="sleep_habits.naps" render={({ field }) => (<FormItem><div className="flex items-center space-x-2 h-full"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl><Label>Faites-vous des siestes ?</Label></div></FormItem>)}/><FormField control={control} name="sleep_habits.insomnia" render={({ field }) => (<FormItem><div className="flex items-center space-x-2 h-full"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl><Label>Souffrez-vous d&apos;insomnie ?</Label></div></FormItem>)}/><FormField control={control} name="sleep_habits.shift_work" render={({ field }) => (<FormItem><div className="flex items-center space-x-2 h-full"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl><Label>Travaillez-vous en horaires décalés ?</Label></div></FormItem>)}/></div></fieldset>
                )}

                {currentStep === 5 && (
                    <fieldset className="space-y-4 p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 6 : Antécédents & Traitements</legend><FormLabel className="font-semibold text-base">Antécédents médicaux</FormLabel><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">{medicalHistoryList.map(item => (<FormField key={item} control={control} name={`medical_history.${item}`} render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div><FormField control={control} name="medical_history_other" render={({ field }) => (<FormItem><FormLabel>Autres conditions médicales importantes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)}/><Separator className="my-6 !mt-8" /><FormField control={control} name="current_treatments" render={({ field }) => (<FormItem><FormLabel className="font-semibold text-base">Traitements actuels</FormLabel><FormDescription>Listez TOUS vos médicaments (ordonnance ou non), suppléments, etc.</FormDescription><FormControl><Textarea placeholder="Ex: Kardegic 75mg, 1 par jour..." {...field} rows={5} /></FormControl></FormItem>)}/></fieldset>
                )}
                
                {currentStep === 6 && (
                    <fieldset className="space-y-6 p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 7 : Habitudes de Vie</legend><FormField control={control} name="life_habits.smoking_status" render={({ field }) => (<FormItem><FormLabel>Tabagisme</FormLabel><Select onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''}><FormControl><SelectTrigger><SelectValue placeholder="-- Statut --" /></SelectTrigger></FormControl><SelectContent><SelectItem value="never">Jamais</SelectItem><SelectItem value="former">Ancien fumeur</SelectItem><SelectItem value="smoker">Fumeur</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>{smokingStatus === 'smoker' && <FormField control={control} name="life_habits.smoking_details" render={({ field }) => (<FormItem><FormLabel>Combien par jour/semaine ?</FormLabel><FormControl><Input {...field} value={typeof field.value === 'string' ? field.value : ''} /></FormControl></FormItem>)}/> }<Separator/><FormField control={control} name="life_habits.alcohol_status" render={({ field }) => (<FormItem><FormLabel>Consommation d&apos;alcool</FormLabel><Select onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''}><FormControl><SelectTrigger><SelectValue placeholder="-- Fréquence --" /></SelectTrigger></FormControl><SelectContent><SelectItem value="never">Jamais</SelectItem><SelectItem value="occasional">Occasionnelle</SelectItem><SelectItem value="regular">Régulière</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>{alcoholStatus === 'regular' && <FormField control={control} name="life_habits.alcohol_details" render={({ field }) => (<FormItem><FormLabel>Précisez quantité/fréquence</FormLabel><FormControl><Input {...field} value={typeof field.value === 'string' ? field.value : ''} /></FormControl></FormItem>)}/> }</fieldset>
                )}

                {currentStep === 7 && (
                    <fieldset className="space-y-6 p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 8 : Conduite Automobile</legend><FormField control={control} name="driving_info.has_license" render={({ field }) => (<FormItem><FormLabel>Possédez-vous un permis de conduire ?</FormLabel><RadioGroup onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''} className="flex space-x-4"><FormItem><FormControl><RadioGroupItem value="oui"/></FormControl><Label>Oui</Label></FormItem><FormItem><FormControl><RadioGroupItem value="non"/></FormControl><Label>Non</Label></FormItem></RadioGroup></FormItem>)}/>{hasDrivingLicense === 'oui' && ( <div className="space-y-6 pt-4 border-t"><FormField control={control} name="driving_info.license_type" render={({ field }) => (<FormItem><FormLabel>Type de permis</FormLabel><Select onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="group1">Véhicules légers &lpar;Groupe 1&rpar;</SelectItem><SelectItem value="group2">Véhicules lourds &lpar;Groupe 2&rpar;</SelectItem></SelectContent></Select></FormItem>)}/> <FormField control={control} name="driving_info.sleepy_while_driving" render={({ field }) => (<FormItem><div className="flex items-center space-x-2"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl><Label>Déjà senti somnolent&lpar;e&rpar; au volant ?</Label></div></FormItem>)}/> <FormField control={control} name="driving_info.accident_related_to_sleepiness" render={({ field }) => (<FormItem><div className="flex items-center space-x-2"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl><Label>Déjà eu un accident/frayeur lié&lpar;e&rpar; à la somnolence ?</Label></div></FormItem>)}/></div>)}</fieldset>
                )}

                {currentStep === 8 && (
                    <fieldset className="space-y-6 p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 9 : Vos Antécédents (Sommeil)</legend><FormField control={control} name="sleep_disorder_history.had_treatment" render={({ field }) => (<FormItem><FormLabel>Avez-vous déjà été traité(e) pour un trouble du sommeil ?</FormLabel><RadioGroup onValueChange={field.onChange} defaultValue={typeof field.value === 'string' ? field.value : ''} className="flex space-x-4"><FormItem><FormControl><RadioGroupItem value="oui"/></FormControl><Label>Oui</Label></FormItem><FormItem><FormControl><RadioGroupItem value="non"/></FormControl><Label>Non</Label></FormItem></RadioGroup></FormItem>)}/>{hadPastTreatment === 'oui' && (<div className="space-y-4 pt-4 border-t"><FormLabel>Par quel(s) moyen(s) ?</FormLabel>{pastTreatmentsList.map(item => (<FormField key={item} control={control} name={`sleep_disorder_history.treatments.${item}`} render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div>)}</fieldset>
                )}

                {currentStep === 9 && (
                    <>
                    <fieldset className="p-6 border rounded-lg"><legend className="font-bold px-2 text-xl">Section 10 : Commentaires Libres</legend><FormField control={control} name="free_comments" render={({ field }) => (<FormItem><FormLabel>Veuillez ajouter ici toute information que vous jugez importante.</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl></FormItem>)}/></fieldset>
                    {totalEpworthScore > 10 && (<fieldset className="p-6 border-2 border-red-500 rounded-lg bg-red-50"><legend className="font-bold px-2 text-xl text-red-700">Section 11 : Information Importante &lpar;Conduite&rpar;</legend><div className="prose prose-sm max-w-none text-gray-800 space-y-2 mt-4"><p>Votre score de somnolence &lpar;{totalEpworthScore}&rpar; est considéré comme élevé. Il est crucial de lire et comprendre les informations suivantes :</p><ul className="list-disc pl-5"><li>Une somnolence excessive augmente significativement le risque d&apos;accidents de la route.</li><li>Selon la loi, il est de votre responsabilité de ne pas conduire en cas de somnolence et de déclarer tout trouble du sommeil diagnostiqué à un médecin agréé par la préfecture pour évaluer votre aptitude à la conduite.</li><li>En cas d&apos;accident lié à la somnolence sans avoir fait cette démarche, votre responsabilité pourrait être engagée et votre assurance pourrait ne pas couvrir les dommages.</li></ul></div><FormField control={control} name="consent_signature" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6 bg-white shadow-sm"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Je confirme avoir lu et compris ces informations sur les risques et mes obligations légales.</FormLabel><FormMessage /></div></FormItem>)}/></fieldset>)}
                    </>
                )}

                <div className="mt-10 flex justify-between">
                    {currentStep > 0 ? (<Button type="button" variant="outline" onClick={handlePrevious}>Précédent</Button>) : (<div></div>)}
                    {currentStep < totalSteps - 1 ? (<Button type="button" onClick={handleNext} disabled={currentStep === 3 && !isEpworthLocked}>Suivant</Button>) : (<Button type="submit" disabled={isSubmitting}> {isSubmitting ? "Enregistrement..." : "Enregistrer et Soumettre"}</Button>)}
                </div>
                {message && <p className={`mt-4 text-center font-medium ${message.includes('erreur') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
            </form>
        </Form>
    </div>
  );
}