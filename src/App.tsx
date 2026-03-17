import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ClipboardList, 
  Home as HomeIcon, 
  User, 
  Accessibility, 
  StretchHorizontal, 
  ShieldCheck,
  Download,
  Share2,
  ArrowRight,
  Clock,
  AlertCircle,
  ChevronDown,
  Search,
  Filter,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSESSMENT_PATHS } from './data';
import { AssessmentPath, AssessmentStep, AssessmentResult } from './types';
import { cn } from './utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- Components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-8">
    <motion.div 
      className="bg-blue-600 h-full"
      initial={{ width: 0 }}
      animate={{ width: `${(current / total) * 100}%` }}
      transition={{ duration: 0.5 }}
    />
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
    secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void; key?: React.Key }) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 transition-all',
      onClick && 'cursor-pointer hover:shadow-md hover:border-blue-100',
      className
    )}
  >
    {children}
  </div>
);

// --- Main Views ---

export default function App() {
  const [view, setView] = useState<'home' | 'paths' | 'assessment' | 'summary' | 'dashboard'>('home');
  const [selectedPath, setSelectedPath] = useState<AssessmentPath | null>(null);
  const [patientName, setPatientName] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 for patient name entry
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [exerciseResults, setExerciseResults] = useState<Record<string, { reps: number; feedback: string }>>({});
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);

  // Load history from localStorage or set mock data
  useEffect(() => {
    const saved = localStorage.getItem('physio_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    } else {
      const mockData: AssessmentResult[] = [
        {
          id: 'mock1',
          date: '15/03/2026, 10:30:00',
          patientName: 'Mario Rossi',
          pathId: 'atleta',
          pathTitle: 'Recupero infortunio per atleta',
          answers: { step1: 'ginocchio', step2: 3, step3: 7, step7: 20 },
          exerciseResults: { 
            step4: { reps: 22, feedback: 'Buona stabilità, continua il rinforzo.' },
            step9: { reps: 18, feedback: 'Buona capacità funzionale.' }
          }
        },
        {
          id: 'mock2',
          date: '14/03/2026, 15:45:00',
          patientName: 'Giuseppe Bianchi',
          pathId: 'anziani',
          pathTitle: 'Programma movimento per anziani',
          answers: { s1: 'bene', s2: 2, s4: 4, s7: 80 },
          exerciseResults: { 
            s3: { reps: 12, feedback: 'Ottima' },
            s5: { reps: 35, feedback: 'Ritmo costante' }
          }
        },
        {
          id: 'mock3',
          date: '12/03/2026, 09:15:00',
          patientName: 'Elena Verdi',
          pathId: 'posturale',
          pathTitle: 'Esercizio posturale',
          answers: { p1: 'collo', p2: 5, p7: 6 },
          exerciseResults: { 
            p3: { reps: 15, feedback: 'Sciolto' },
            p8: { reps: 12, feedback: 'Fluido' }
          }
        },
        {
          id: 'mock4',
          date: '10/03/2026, 11:00:00',
          patientName: 'Luca Neri',
          pathId: 'mobilita',
          pathTitle: 'Valutazione mobilità e flessibilità',
          answers: { m1: 'si', m3: 1, m5: 8 },
          exerciseResults: { 
            m2: { reps: 2, feedback: 'Ottima' },
            m4: { reps: 12, feedback: 'Ottima' }
          }
        },
        {
          id: 'mock5',
          date: '08/03/2026, 16:20:00',
          patientName: 'Roberto Gialli',
          pathId: 'prevenzione',
          pathTitle: 'Prevenzione infortuni sportivi',
          answers: { pr1: 'running', pr3: 0, pr5: 3 },
          exerciseResults: { 
            pr2: { reps: 12, feedback: 'Ottima potenza' },
            pr4: { reps: 55, feedback: 'Core forte' }
          }
        },
        {
          id: 'mock6',
          date: '05/03/2026, 09:45:00',
          patientName: 'Anna Viola',
          pathId: 'atleta',
          pathTitle: 'Recupero infortunio per atleta',
          answers: { step1: 'caviglia', step2: 2, step3: 5 },
          exerciseResults: { 
            step4: { reps: 15, feedback: 'Buona stabilità' },
            step9: { reps: 10, feedback: 'Forza da migliorare' }
          }
        },
        {
          id: 'mock7',
          date: '01/03/2026, 14:15:00',
          patientName: 'Marco Blu',
          pathId: 'anziani',
          pathTitle: 'Programma movimento per anziani',
          answers: { s1: 'stanco', s2: 4, s4: 7 },
          exerciseResults: { 
            s3: { reps: 6, feedback: 'Buona' },
            s5: { reps: 25, feedback: 'Ritmo costante' }
          }
        },
        {
          id: 'mock8',
          date: '01/02/2026, 10:00:00',
          patientName: 'Mario Rossi',
          pathId: 'atleta',
          pathTitle: 'Recupero infortunio per atleta',
          answers: { step1: 'ginocchio', step2: 5, step3: 8 },
          exerciseResults: { 
            step4: { reps: 10, feedback: 'Inizio recupero' },
            step9: { reps: 8, feedback: 'Forza limitata' }
          }
        },
        {
          id: 'mock9',
          date: '15/02/2026, 11:30:00',
          patientName: 'Mario Rossi',
          pathId: 'atleta',
          pathTitle: 'Recupero infortunio per atleta',
          answers: { step1: 'ginocchio', step2: 4, step3: 7 },
          exerciseResults: { 
            step4: { reps: 15, feedback: 'Miglioramento' },
            step9: { reps: 12, feedback: 'Progresso costante' }
          }
        },
        {
          id: 'mock10',
          date: '01/03/2026, 09:00:00',
          patientName: 'Mario Rossi',
          pathId: 'atleta',
          pathTitle: 'Recupero infortunio per atleta',
          answers: { step1: 'ginocchio', step2: 3, step3: 7 },
          exerciseResults: { 
            step4: { reps: 18, feedback: 'Buona stabilità' },
            step9: { reps: 15, feedback: 'Quasi a pieno regime' }
          }
        }
      ];
      setHistory(mockData);
      localStorage.setItem('physio_history', JSON.stringify(mockData));
    }
  }, []);

  const saveToHistory = (result: AssessmentResult) => {
    const newHistory = [result, ...history];
    setHistory(newHistory);
    localStorage.setItem('physio_history', JSON.stringify(newHistory));
  };

  const resetAssessment = () => {
    setCurrentStepIndex(-1);
    setPatientName('');
    setAnswers({});
    setExerciseResults({});
  };

  const startAssessment = (path: AssessmentPath) => {
    setSelectedPath(path);
    resetAssessment();
    setView('assessment');
  };

  const handleNext = () => {
    if (!selectedPath) return;
    
    // Find next valid step
    let nextIndex = currentStepIndex + 1;
    while (nextIndex < selectedPath.steps.length) {
      const step = selectedPath.steps[nextIndex];
      if (!step.condition || step.condition(answers)) {
        break;
      }
      nextIndex++;
    }

    if (nextIndex >= selectedPath.steps.length) {
      // Finish
      const result: AssessmentResult = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleString(),
        patientName: patientName || 'Paziente Anonimo',
        pathId: selectedPath.id,
        pathTitle: selectedPath.title,
        answers,
        exerciseResults,
      };
      saveToHistory(result);
      setView('summary');
    } else {
      setCurrentStepIndex(nextIndex);
    }
  };

  const handleBack = () => {
    if (currentStepIndex <= 0) {
      if (currentStepIndex === -1) {
        setView('paths');
      } else {
        setCurrentStepIndex(-1);
      }
      return;
    }
    
    // Find previous valid step
    let prevIndex = currentStepIndex - 1;
    while (prevIndex >= 0) {
      const step = selectedPath!.steps[prevIndex];
      if (!step.condition || step.condition(answers)) {
        break;
      }
      prevIndex--;
    }
    
    if (prevIndex < 0) {
      setView('paths');
    } else {
      setCurrentStepIndex(prevIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setView('home')}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Activity size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Physio<span className="text-blue-600">Assess</span></span>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-4">
            <Button variant="ghost" onClick={() => setView('home')} className="px-3 py-2 text-sm sm:text-base">
              <HomeIcon size={18} /> <span className="hidden sm:inline">Home</span>
            </Button>
            <Button variant="ghost" onClick={() => setView('dashboard')} className="px-3 py-2 text-sm sm:text-base">
              <ClipboardList size={18} /> <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900">
                  Valutazione Professionale <br />
                  <span className="text-blue-600">Semplice e Guidata</span>
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                  Accompagna i tuoi pazienti attraverso percorsi di recupero e performance strutturati con feedback in tempo reale.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button onClick={() => setView('paths')} className="w-full sm:w-auto text-lg px-8 py-4">
                  Inizia Nuovo Assessment <ArrowRight size={20} />
                </Button>
                <Button variant="outline" onClick={() => setView('dashboard')} className="w-full sm:w-auto text-lg px-8 py-4">
                  Vedi Dashboard Risultati
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
                {[
                  { title: 'Percorsi Dinamici', desc: 'Domande che si adattano alle risposte del paziente.', icon: Activity },
                  { title: 'Esercizi Guidati', desc: 'Timer e contatori integrati per test fisici precisi.', icon: Play },
                  { title: 'Report Immediati', desc: 'Riepilogo dettagliato pronto per la condivisione.', icon: ClipboardList },
                ].map((feature, i) => (
                  <Card key={i} className="text-left border-none shadow-none bg-blue-50/50">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-4">
                      <feature.icon size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'paths' && (
            <motion.div 
              key="paths"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Seleziona Percorso</h2>
                <Button variant="ghost" onClick={() => setView('home')}>
                  <ChevronLeft size={20} /> Indietro
                </Button>
              </div>

              <div className="space-y-4">
                {ASSESSMENT_PATHS.map((path) => {
                  const Icon = {
                    Activity,
                    User,
                    Accessibility,
                    StretchHorizontal,
                    ShieldCheck
                  }[path.icon] || Activity;

                  const isExpanded = expandedPathId === path.id;

                  return (
                    <div key={path.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
                      <button 
                        onClick={() => setExpandedPathId(isExpanded ? null : path.id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors", 
                            isExpanded ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                          )}>
                            <Icon size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{path.title}</h3>
                            <p className="text-gray-500 text-sm">{path.duration} • {path.steps.length} Step</p>
                          </div>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                          <ChevronDown size={24} className="text-gray-400" />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 border-t border-gray-50 bg-gray-50/30">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Descrizione Percorso</h4>
                                  <p className="text-gray-600 leading-relaxed">{path.description}</p>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                      {path.steps.length} Step Totali
                                    </span>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                      {path.steps.filter(s => s.type === 'exercise').length} Esercizi Fisici
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Anteprima Valutazione</h4>
                                  <ul className="space-y-2">
                                    {path.steps.slice(0, 3).map((step, idx) => (
                                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        {step.question.length > 50 ? step.question.substring(0, 50) + '...' : step.question}
                                      </li>
                                    ))}
                                    <li className="text-xs text-blue-600 font-medium italic">...e altri {path.steps.length - 3} step diagnostici</li>
                                  </ul>
                                  <Button onClick={() => startAssessment(path)} className="w-full mt-4">
                                    Inizia Assessment <ArrowRight size={18} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {view === 'assessment' && selectedPath && (
            <AssessmentWizard 
              path={selectedPath} 
              currentIndex={currentStepIndex}
              patientName={patientName}
              setPatientName={setPatientName}
              answers={answers}
              setAnswers={setAnswers}
              exerciseResults={exerciseResults}
              setExerciseResults={setExerciseResults}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {view === 'summary' && (selectedPath || selectedResult) && (
            <SummaryView 
              result={selectedResult || history[0]} 
              onClose={() => {
                setView('home');
                setSelectedResult(null);
              }} 
              onDashboard={() => {
                setView('dashboard');
                setSelectedResult(null);
              }}
            />
          )}

          {view === 'dashboard' && (
            <DashboardView 
              history={history} 
              onSelectResult={(res) => {
                // We'll reuse the summary view but with a specific result
                // We can just set the history[0] to this result temporarily or pass it
                // For simplicity, let's add a 'selectedResult' state
                setSelectedResult(res);
                setView('summary');
              }}
              onBack={() => setView('home')}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-50">
            <Activity size={20} />
            <span className="font-bold text-lg">PhysioAssess</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; 2026 PhysioAssess. Strumento professionale per la valutazione sportiva e riabilitativa.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function AssessmentWizard({ 
  path, 
  currentIndex, 
  patientName,
  setPatientName,
  answers, 
  setAnswers, 
  exerciseResults,
  setExerciseResults,
  onNext, 
  onBack 
}: { 
  path: AssessmentPath; 
  currentIndex: number;
  patientName: string;
  setPatientName: (val: string) => void;
  answers: Record<string, any>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  exerciseResults: Record<string, { reps: number; feedback: string }>;
  setExerciseResults: React.Dispatch<React.SetStateAction<Record<string, { reps: number; feedback: string }>>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const isPatientStep = currentIndex === -1;
  const step = !isPatientStep ? path.steps[currentIndex] : null;
  const currentStepNumber = currentIndex + 1;
  const totalSteps = path.steps.length;

  const handleAnswer = (val: any) => {
    if (step) setAnswers(prev => ({ ...prev, [step.id]: val }));
  };

  const isStepComplete = useMemo(() => {
    if (isPatientStep) return patientName.trim().length > 0;
    if (!step) return false;
    const val = answers[step.id];
    if (step.type === 'exercise') return exerciseResults[step.id] !== undefined;
    return val !== undefined && val !== '' && (typeof val === 'string' ? val.trim() !== '' : true);
  }, [answers, step, exerciseResults, isPatientStep, patientName]);

  return (
    <motion.div 
      key={isPatientStep ? 'patient-step' : step?.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm font-medium text-gray-400">
          <span>{isPatientStep ? 'Inizio Assessment' : `Step ${currentStepNumber} di ${totalSteps}`}</span>
          <span>{path.title}</span>
        </div>
        {!isPatientStep && <ProgressBar current={currentStepNumber} total={totalSteps} />}
      </div>

      <Card className="p-6 sm:p-12 shadow-xl border-blue-50">
        {isPatientStep ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Dati del Paziente</h2>
              <p className="text-gray-500 text-sm sm:text-base">Inserisci il nome del paziente per iniziare la valutazione.</p>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] sm:text-sm font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
              <input 
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="es. Mario Rossi"
                className="w-full p-3 sm:p-4 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:ring-0 transition-all text-lg sm:text-xl"
                autoFocus
              />
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800 leading-tight">
              {step?.question}
            </h2>

            <div className="min-h-[150px] sm:min-h-[200px]">
              {step && (
                <StepRenderer 
                  step={step} 
                  value={answers[step.id]} 
                  onChange={handleAnswer}
                  onExerciseComplete={(res) => setExerciseResults(prev => ({ ...prev, [step.id]: res }))}
                  exerciseResult={exerciseResults[step.id]}
                />
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft size={20} /> Indietro
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!isStepComplete}
            className="min-w-[140px]"
          >
            {isPatientStep ? 'Inizia' : (currentStepNumber === totalSteps ? 'Concludi' : 'Avanti')} <ChevronRight size={20} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function StepRenderer({ 
  step, 
  value, 
  onChange, 
  onExerciseComplete,
  exerciseResult
}: { 
  step: AssessmentStep; 
  value: any; 
  onChange: (val: any) => void;
  onExerciseComplete: (res: { reps: number; feedback: string }) => void;
  exerciseResult?: { reps: number; feedback: string };
}) {
  switch (step.type) {
    case 'choice':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {step.options?.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all font-medium',
                value === opt.value 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );

    case 'scale':
      return (
        <div className="space-y-8">
          <div className="flex flex-wrap justify-center sm:justify-between gap-3 sm:gap-2">
            {Array.from({ length: (step.max || 10) - (step.min || 1) + 1 }).map((_, i) => {
              const num = (step.min || 1) + i;
              return (
                <button
                  key={num}
                  onClick={() => onChange(num)}
                  className={cn(
                    'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all border-2',
                    value === num 
                      ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow-lg' 
                      : 'bg-white text-gray-400 border-gray-100 hover:border-blue-300 hover:text-blue-500'
                  )}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Minimo</span>
            <span>Massimo</span>
          </div>
        </div>
      );

    case 'pain':
      return (
        <div className="space-y-8">
          <div className="flex justify-between gap-1 sm:gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const colors = [
                'bg-emerald-500', 'bg-emerald-400', 'bg-green-400', 
                'bg-yellow-400', 'bg-yellow-500', 'bg-orange-400', 
                'bg-orange-500', 'bg-red-400', 'bg-red-500', 
                'bg-red-600', 'bg-red-700'
              ];
              return (
                <button
                  key={num}
                  onClick={() => onChange(num)}
                  className={cn(
                    'flex-1 h-12 sm:h-16 rounded-lg transition-all flex flex-col items-center justify-center gap-1',
                    value === num ? 'ring-4 ring-blue-200 scale-105 z-10' : 'opacity-60 hover:opacity-100',
                    colors[num]
                  )}
                >
                  <span className="text-white font-bold text-xs sm:text-sm">{num}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Nessun Dolore</span>
            <span>Dolore Insopportabile</span>
          </div>
        </div>
      );

    case 'slider':
      return (
        <div className="space-y-8">
          <input 
            type="range" 
            min={step.min || 0} 
            max={step.max || 100} 
            value={value || 0}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="text-center">
            <span className="text-4xl sm:text-5xl font-black text-blue-600">{value || 0}%</span>
          </div>
        </div>
      );

    case 'text':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Inserisci qui i tuoi commenti o note..."
          className="w-full h-40 p-4 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:ring-0 transition-all resize-none text-lg"
        />
      );

    case 'exercise':
      if (exerciseResult) {
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Esercizio Completato!</h3>
              <p className="text-gray-500">Hai eseguito <span className="text-blue-600 font-bold">{exerciseResult.reps}</span> ripetizioni.</p>
            </div>
            
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Note e Feedback (Personalizzabile)</label>
              <textarea
                value={exerciseResult.feedback}
                onChange={(e) => onExerciseComplete({ ...exerciseResult, feedback: e.target.value })}
                className="w-full p-4 rounded-xl bg-blue-50 border-2 border-blue-100 text-blue-900 font-medium italic focus:border-blue-300 focus:ring-0 transition-all resize-none h-24"
              />
            </div>

            <Button variant="outline" onClick={() => onExerciseComplete(undefined as any)} className="mx-auto">
              <RotateCcw size={18} /> Ripeti Test
            </Button>
          </div>
        );
      }
      return (
        <ExerciseRunner 
          exercise={step.exercise!} 
          onComplete={onExerciseComplete} 
        />
      );

    default:
      return null;
  }
}

function ExerciseRunner({ 
  exercise, 
  onComplete 
}: { 
  exercise: any; 
  onComplete: (res: { reps: number; feedback: string }) => void 
}) {
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [reps, setReps] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showIllustration, setShowIllustration] = useState(!!exercise.illustrationUrl);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev: number) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setIsFinished(true);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleFinish = () => {
    let feedback = exercise.feedback.low;
    if (reps >= exercise.feedback.thresholds[1]) {
      feedback = exercise.feedback.high;
    } else if (reps >= exercise.feedback.thresholds[0]) {
      feedback = exercise.feedback.medium;
    }
    onComplete({ reps, feedback });
  };

  if (showIllustration) {
    return (
      <div className="space-y-8 py-4">
        <div className="space-y-4 text-center">
          <h3 className="text-2xl font-bold text-gray-800">Come eseguire l'esercizio</h3>
          <p className="text-gray-500">Guarda l'illustrazione per assicurarti di mantenere la forma corretta.</p>
        </div>
        
        <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden border-4 border-white shadow-lg relative group">
          <img 
            src={exercise.illustrationUrl} 
            alt={exercise.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6">
            <div className="text-white">
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">Esercizio</div>
              <div className="text-xl font-bold">{exercise.title}</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <p className="text-blue-800 text-sm leading-relaxed italic">
            <AlertCircle size={16} className="inline mr-2 mb-1" />
            {exercise.description}
          </p>
        </div>

        <Button onClick={() => setShowIllustration(false)} className="w-full py-6 text-xl">
          Capito, Inizia! <ArrowRight size={24} />
        </Button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="text-center space-y-8 py-4">
        <div className="space-y-2">
          <h3 className="text-3xl font-bold">Tempo Scaduto!</h3>
          <p className="text-gray-500">Ottimo lavoro, ecco il tuo risultato.</p>
        </div>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="text-4xl font-black text-blue-600">{reps}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ripetizioni</div>
          </div>
        </div>
        <Button onClick={handleFinish} className="w-full">
          Salva Risultato
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-2">
        <h3 className="font-bold text-blue-900 flex items-center gap-2">
          <Accessibility size={20} /> {exercise.title}
        </h3>
        <p className="text-blue-800/70 text-sm leading-relaxed">{exercise.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Timer</div>
          <div className={cn(
            "text-4xl sm:text-6xl font-black tabular-nums transition-colors",
            timeLeft <= 5 ? "text-red-500" : "text-gray-900"
          )}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Counter</div>
          <div className="text-4xl sm:text-6xl font-black text-blue-600 tabular-nums">{reps}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {!isActive && timeLeft === exercise.duration ? (
          <Button onClick={() => setIsActive(true)} className="flex-1 py-6 text-xl">
            <Play size={24} /> START
          </Button>
        ) : (
          <>
            <Button 
              variant={isActive ? 'outline' : 'primary'} 
              onClick={() => setIsActive(!isActive)} 
              className="flex-1"
              disabled={timeLeft === 0}
            >
              {isActive ? <><Pause size={20} /> PAUSA</> : <><Play size={20} /> RIPRENDI</>}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setReps(r => r + 1)} 
              className="flex-1 py-6 text-xl"
              disabled={!isActive}
            >
              +1 RIPETIZIONE
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="ghost" 
          onClick={() => {
            setIsActive(false);
            setTimeLeft(exercise.duration);
            setReps(0);
            setIsFinished(false);
          }}
          className="flex-1"
        >
          <RotateCcw size={18} /> Reset
        </Button>
        {(isActive || timeLeft < exercise.duration) && (
          <Button 
            variant="outline" 
            onClick={() => setIsFinished(true)}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            Termina Anticipatamente
          </Button>
        )}
      </div>
    </div>
  );
}

function SummaryView({ 
  result, 
  onClose, 
  onDashboard 
}: { 
  result: AssessmentResult; 
  onClose: () => void;
  onDashboard: () => void;
}) {
  const exportPDF = async () => {
    const element = document.getElementById('summary-report');
    if (!element) return;
    
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Assessment_${result.pathTitle.replace(/\s+/g, '_')}_${result.date.split(',')[0]}.pdf`);
  };

  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: `Risultato Assessment: ${result.pathTitle}`,
        text: `Ho completato l'assessment ${result.pathTitle}. Ecco i miei risultati.`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('La condivisione non è supportata su questo browser.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Risultato Assessment</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportPDF} className="flex-1 sm:flex-none">
            <Download size={18} /> PDF
          </Button>
          <Button variant="outline" onClick={shareReport} className="flex-1 sm:flex-none">
            <Share2 size={18} /> Condividi
          </Button>
        </div>
      </div>

      <div id="summary-report" className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <div className="text-blue-600 font-bold uppercase tracking-widest text-xs">Paziente</div>
            <h3 className="text-2xl font-bold">{result.patientName}</h3>
          </div>
          <div className="text-right space-y-1">
            <div className="text-gray-400 font-bold uppercase tracking-widest text-xs">Percorso</div>
            <div className="font-medium">{result.pathTitle}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="font-bold text-lg flex items-center gap-2 text-gray-700">
              <ClipboardList size={20} className="text-blue-600" /> Risposte Assessment
            </h4>
            <div className="space-y-4">
              {Object.entries(result.answers).map(([stepId, val]) => {
                // Find question text
                const path = ASSESSMENT_PATHS.find(p => p.id === result.pathId);
                const step = path?.steps.find(s => s.id === stepId);
                if (!step || step.type === 'exercise') return null;

                return (
                  <div key={stepId} className="bg-gray-50 p-4 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-gray-400">{step.question}</div>
                    <div className="font-semibold text-gray-800">
                      {step.type === 'choice' 
                        ? step.options?.find(o => o.value === val)?.label 
                        : val}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-lg flex items-center gap-2 text-gray-700">
              <Activity size={20} className="text-emerald-600" /> Performance Esercizi
            </h4>
            <div className="space-y-4">
              {Object.entries(result.exerciseResults).map(([stepId, res]) => {
                const path = ASSESSMENT_PATHS.find(p => p.id === result.pathId);
                const step = path?.steps.find(s => s.id === stepId);
                if (!step) return null;

                return (
                  <div key={stepId} className="border-2 border-emerald-50 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{step.exercise?.title}</div>
                      <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                        {res.reps} Ripetizioni
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic">"{res.feedback}"</p>
                  </div>
                );
              })}
              {Object.keys(result.exerciseResults).length === 0 && (
                <div className="text-center py-8 text-gray-400 italic">
                  Nessun esercizio fisico incluso in questo percorso.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100">
          <div className="bg-blue-50 p-6 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-blue-600 shrink-0" size={24} />
            <div className="space-y-1">
              <h5 className="font-bold text-blue-900">Nota del Professionista</h5>
              <p className="text-blue-800/70 text-sm">
                Questi risultati sono indicativi. Si consiglia di discutere questo report durante la prossima seduta per affinare il piano terapeutico.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={onClose} className="flex-1">Torna alla Home</Button>
        <Button variant="outline" onClick={onDashboard} className="flex-1">Vai alla Dashboard</Button>
      </div>
    </motion.div>
  );
}

function DashboardView({ 
  history, 
  onSelectResult, 
  onBack 
}: { 
  history: AssessmentResult[]; 
  onSelectResult: (res: AssessmentResult) => void;
  onBack: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patientFilter, setPatientFilter] = useState('all');
  const [pathFilter, setPathFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  const filteredHistory = useMemo(() => {
    return history.filter(res => {
      const matchesSearch = res.patientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPatient = patientFilter === 'all' || res.patientName === patientFilter;
      const matchesPath = pathFilter === 'all' || res.pathId === pathFilter;
      
      // Date filtering
      let matchesDate = true;
      const resDate = new Date(res.date.split(',')[0].split('/').reverse().join('-')); // Convert DD/MM/YYYY to YYYY-MM-DD
      
      if (dateRange === 'custom') {
        if (startDate) {
          const sDate = new Date(startDate);
          if (resDate < sDate) matchesDate = false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          if (resDate > eDate) matchesDate = false;
        }
      } else if (dateRange !== 'all') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (dateRange === 'today') {
          matchesDate = resDate.toDateString() === now.toDateString();
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = resDate >= weekAgo;
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = resDate >= monthAgo;
        }
      }

      // Score filtering (reps)
      let matchesScore = true;
      const scores = Object.values(res.exerciseResults).map((r: any) => r.reps);
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (minScore && avgScore < parseInt(minScore)) matchesScore = false;
        if (maxScore && avgScore > parseInt(maxScore)) matchesScore = false;
      } else if (minScore || maxScore) {
        // If filtering by score but no exercises performed, exclude
        matchesScore = false;
      }

      return matchesSearch && matchesPatient && matchesPath && matchesDate && matchesScore;
    });
  }, [history, searchTerm, patientFilter, pathFilter, dateRange, startDate, endDate, minScore, maxScore]);

  const uniquePatientNames = useMemo(() => {
    return Array.from(new Set(history.map(h => h.patientName))).sort();
  }, [history]);

  const stats = useMemo(() => {
    const uniquePatients = new Set(history.map(h => h.patientName)).size;
    const pathCounts = history.reduce((acc, curr) => {
      acc[curr.pathTitle] = (acc[curr.pathTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonPath = Object.entries(pathCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      total: history.length,
      patients: uniquePatients,
      commonPath: mostCommonPath
    };
  }, [history]);

  const chartData = useMemo(() => {
    return [...filteredHistory]
      .sort((a, b) => {
        const dateA = new Date(a.date.split(',')[0].split('/').reverse().join('-'));
        const dateB = new Date(b.date.split(',')[0].split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      })
      .map(res => {
        const exerciseValues = Object.values(res.exerciseResults) as { reps: number; feedback: string }[];
        const scores = exerciseValues.map(r => r.reps);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return {
          date: res.date.split(',')[0],
          paziente: res.patientName,
          media: parseFloat(avg.toFixed(1))
        };
      });
  }, [filteredHistory]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard Analitica</h2>
          <p className="text-gray-500">Monitora i progressi e gestisci lo storico dei pazienti.</p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft size={20} /> Indietro
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-blue-600 text-white border-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardList size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">Totale Assessment</div>
              <div className="text-2xl font-black">{stats.total}</div>
            </div>
          </div>
        </Card>
        <Card className="bg-emerald-600 text-white border-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">Pazienti Unici</div>
              <div className="text-2xl font-black">{stats.patients}</div>
            </div>
          </div>
        </Card>
        <Card className="bg-amber-500 text-white border-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">Percorso Frequente</div>
              <div className="text-sm font-bold truncate max-w-[150px]">{stats.commonPath}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Chart */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold">Andamento Performance</h3>
            <p className="text-sm text-gray-500">
              {patientFilter !== 'all' 
                ? `Progresso di ${patientFilter}` 
                : 'Media ripetizioni nel tempo per i filtri selezionati.'}
            </p>
          </div>
          {chartData.length > 1 && (
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <TrendingUp size={14} /> Trend Analizzato
            </div>
          )}
        </div>

        {chartData.length > 0 ? (
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="media" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMedia)" 
                  animationDuration={1500}
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] w-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-50 rounded-2xl">
            <TrendingUp size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Nessun dato sufficiente per generare il grafico.</p>
            <p className="text-xs opacity-60">Prova a cambiare i filtri o seleziona un paziente con più sessioni.</p>
          </div>
        )}
      </Card>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cerca per nome paziente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-50 focus:border-blue-600 focus:ring-0 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <User size={16} className="text-gray-400" />
            <select 
              value={patientFilter}
              onChange={(e) => {
                setPatientFilter(e.target.value);
                if (e.target.value !== 'all') setSearchTerm('');
              }}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Tutti i Pazienti</option>
              {uniquePatientNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Tutti i Percorsi</option>
              {ASSESSMENT_PATHS.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <Calendar size={16} className="text-gray-400" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Sempre</option>
              <option value="today">Oggi</option>
              <option value="week">Ultima Settimana</option>
              <option value="month">Ultimo Mese</option>
              <option value="custom">Range Personalizzato</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-50 text-sm font-medium px-3 py-2 rounded-lg border border-gray-100 focus:outline-none focus:border-blue-600"
              />
              <span className="text-gray-400 text-xs">al</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-50 text-sm font-medium px-3 py-2 rounded-lg border border-gray-100 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <TrendingUp size={16} className="text-gray-400" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Media:</span>
              <input 
                type="number" 
                placeholder="Min"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-10 bg-transparent text-sm font-medium focus:outline-none"
              />
              <span className="text-gray-300">-</span>
              <input 
                type="number" 
                placeholder="Max"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-10 bg-transparent text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          { (searchTerm || patientFilter !== 'all' || pathFilter !== 'all' || dateRange !== 'all' || minScore || maxScore) && (
            <Button variant="ghost" onClick={() => {
              setSearchTerm('');
              setPatientFilter('all');
              setPathFilter('all');
              setDateRange('all');
              setStartDate('');
              setEndDate('');
              setMinScore('');
              setMaxScore('');
            }} className="text-xs h-9 px-3">
              Reset Filtri
            </Button>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs">
            Risultati ({filteredHistory.length})
          </h3>
        </div>

        {filteredHistory.length === 0 ? (
          <Card className="text-center py-12 space-y-4 bg-gray-50/50 border-dashed border-2">
            <div className="text-gray-300">Nessun risultato trovato con i filtri attuali.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredHistory.map((res) => (
              <Card key={res.id} className="hover:border-blue-200 transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{res.patientName}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium text-blue-600/70">{res.pathTitle}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {res.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Esercizi</div>
                      <div className="font-bold text-gray-900">{Object.keys(res.exerciseResults).length}</div>
                    </div>
                    {Object.keys(res.exerciseResults).length > 0 && (
                      <div className="text-right px-4 border-l border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Media Rip.</div>
                        <div className="font-bold text-blue-600">
                          {((Object.values(res.exerciseResults) as { reps: number }[]).reduce((acc, curr) => acc + curr.reps, 0) / Object.keys(res.exerciseResults).length).toFixed(1)}
                        </div>
                      </div>
                    )}
                    <Button variant="ghost" onClick={() => onSelectResult(res)} className="group-hover:bg-blue-50 group-hover:text-blue-600">
                      Vedi Report <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
