import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { GraduationCap, Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Loader2, CheckCircle2, Sparkles, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

const PARTS = [
  { range: [1, 10], name: 'Part 1 · Sentence Structure & Word Order' },
  { range: [11, 20], name: 'Part 2 · WH-Questions' },
  { range: [21, 30], name: 'Part 3 · Forming Questions' },
  { range: [31, 50], name: 'Part 4 · Grammar in Context' },
];

function partFor(order) {
  const p = PARTS.find((x) => order >= x.range[0] && order <= x.range[1]);
  return p ? p.name : '';
}

function fmtTime(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function Exam() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;

  const [questions, setQuestions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const answersRef = useRef({});
  const questionsRef = useRef([]);
  const settingsRef = useRef(null);
  const studentRef = useRef(null);
  const startedAtRef = useRef(null);
  const submittedRef = useRef(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://english-grammer-exam.onrender.com';

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const student = JSON.parse(sessionStorage.getItem('npa_student') || 'null');
      if (!student) { navigate('/student-info', { replace: true }); return; }
      studentRef.current = student;

      try {
        const [qRes, sRes] = await Promise.all([
          fetch(`${API_URL}/api/questions`),
          fetch(`${API_URL}/api/settings`),
        ]);

        if (!qRes.ok) throw new Error('Failed to load questions');
        const qsData = await qRes.json();

        let settingsData = null;
        if (sRes.ok) {
          settingsData = await sRes.json();
        }

        if (!alive) return;

        const activeQs = (qsData || []).filter((q) => q.status === 'active' || !q.status);
        const ordered = activeQs.sort((a, b) => (a.order || 0) - (b.order || 0));

        setQuestions(ordered);
        setSettings(settingsData);

        const mins = (settingsData && settingsData.timeLimit) || 45;
        setTimeLeft(mins * 60);
        startedAtRef.current = Date.now();
      } catch (e) {
        toast({ title: isAr ? 'فشل تحميل الأسئلة' : 'Failed to load questions', description: e.message, variant: 'destructive' });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [navigate, API_URL]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const qs = questionsRef.current;
    const ans = answersRef.current;
    const s = settingsRef.current;
    const student = studentRef.current;
    const pointsPer = (s && s.pointsPerQuestion) || 2;

    let correct = 0;
    const answersSummary = qs.map((q, i) => {
      const selectedAnswer = ans[i] || '';
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        questionId: q._id || q.id,
        selectedAnswer,
        isCorrect,
      };
    });

    const totalQuestions = qs.length;
    const score = correct * pointsPer;
    const totalMarks = totalQuestions * pointsPer;
    const percentage = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
    const timeSpent = startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : 0;
    const status = percentage >= 50 ? 'passed' : 'failed';

    const resultPayload = {
      studentName: student.name,
      score,
      totalQuestions,
      correctAnswers: correct,
      percentage,
      status,
      timeSpent,
      answersSummary,
    };

    try {
      await fetch(`${API_URL}/api/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultPayload),
      });
    } catch (e) {
      console.error('Failed to save result:', e);
    }

    sessionStorage.removeItem('npa_student');
    setSubmitting(false);
    setIsSubmitted(true);
  }, [API_URL]);

  // Timer interval
  useEffect(() => {
    if (loading || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((x) => {
        if (x <= 1) { clearInterval(timer); return 0; }
        return x - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isSubmitted]);

  // Auto-submit on timeout
  useEffect(() => {
    if (!loading && timeLeft === 0 && questions.length > 0 && !submittedRef.current) {
      doSubmit();
    }
  }, [timeLeft, loading, questions, doSubmit]);

  const attemptSubmit = () => {
    const unanswered = questions
      .map((_, i) => (answers[i] ? null : i + 1))
      .filter(Boolean);
    if (unanswered.length) {
      toast({
        title: isAr ? 'هناك أسئلة غير مجابة' : 'Unanswered Questions',
        description: isAr 
          ? `يرجى الإجابة على الأسئلة التالية: ${unanswered.join('، ')}`
          : `Please answer questions: ${unanswered.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }
    setShowConfirm(true);
  };

  const selectOption = (letter) => setAnswers((a) => ({ ...a, [current]: letter }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-7 h-7 animate-spin text-slate-700 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">{isAr ? 'جاري تحميل الامتحان...' : 'Loading exam...'}</p>
        </div>
      </div>
    );
  }

  // Beautiful Congratulations Success Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-50 flex items-center justify-center p-5">
        <Card className="max-w-lg w-full p-8 md:p-10 text-center border-slate-200 shadow-xl rounded-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-60 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

          <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>

          {isAr ? (
            <div className="space-y-3 text-center">
            <h1 className="text-xl font-bold text-slate-900">
                مبروك إكمال الامتحان! 
            </h1>
            
            <p className="text-sm text-slate-600">
              نتمنى لك دوام التوفيق والنجاح. 
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                تم إرسال نتيجتك للإدارة للمراجعة. 
            </div>

            <div className="text-xs text-slate-500 pt-1">
              مع تحيات <span className="font-semibold text-blue-600">أكاديمية نور</span> 🎓
            </div>
          </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                🎉 Congratulations on Completing Your Exam! 🎓✨
              </h1>
              <p className="text-slate-700 text-base leading-relaxed">
                👏 We wish you continued success in your upcoming steps and hope you achieve all your future goals. 🌟📚
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-sm leading-relaxed my-2">
                📩 Your exam results have been successfully sent to the administration for review. ✅
              </div>
              <div className="pt-2 text-slate-800 font-medium text-sm">
                🌹 Best wishes for your future endeavors, <br />
                <span className="font-bold text-blue-600 text-base">💙 Nour Academy 🎓✨</span>
              </div>
            </div>
          )}

          <Button 
            onClick={() => navigate('/')} 
            size="lg" 
            className="w-full h-12 mt-8 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {isAr ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
          </Button>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">{isAr ? 'الامتحان غير متوفر' : 'Exam Unavailable'}</h1>
          <p className="text-sm text-muted-foreground mt-2">{isAr ? 'لا توجد أسئلة متاحة حالياً.' : 'No active questions found.'}</p>
          <Button className="mt-6" onClick={() => navigate('/')}>{isAr ? 'العودة للرئيسية' : 'Back Home'}</Button>
        </Card>
      </div>
    );
  }

  const q = questions[current];
  const qNum = current + 1;
  const options = ['A', 'B', 'C', 'D'];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((qNum / questions.length) * 100);
  const lowTime = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-20 flex items-center gap-3">
          <img 
            src="./noor.jpeg" 
            alt="Logo" 
            className="h-12 w-auto object-contain rounded-xl shrink-0" 
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">{isAr ? 'امتحان القواعد النهائي' : 'Final Grammar Exam'}</div>
            <div className="text-[11px] text-muted-foreground hidden sm:block">{isAr ? 'أكاديمية نور' : 'Nour Academy'}</div>
          </div>
          <div className="ms-auto flex items-center gap-3">
            <LangSwitch />
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold tabular-nums',
              lowTime ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
            )}>
              <Clock className="w-4 h-4" />
              {fmtTime(timeLeft)}
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 md:px-6 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{isAr ? `السؤال ${qNum} من ${questions.length}` : `Question ${qNum} of ${questions.length}`}</span>
            <span>{isAr ? `تمت الإجابة على ${answeredCount} من ${questions.length}` : `Answered ${answeredCount} of ${questions.length}`}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 grid lg:grid-cols-[1fr_220px] gap-6">
        <main>
          <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-600 mb-2">
            {q.part || partFor(q.order || qNum)}
          </div>
          <Card className="p-5 md:p-8">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full bg-slate-900 text-white text-sm font-semibold flex items-center justify-center">
                {String(qNum).padStart(2, '0')}
              </div>
              <h2 className="text-lg md:text-xl font-medium text-slate-900 leading-relaxed pt-1">
                {q.questionText}
              </h2>
            </div>

            <div className="mt-6 space-y-3">
              {options.map((letter) => {
                const selected = answers[current] === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => selectOption(letter)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3.5 md:p-4 rounded-xl border text-start transition-all',
                      selected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span className={cn(
                      'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border',
                      selected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300'
                    )}>
                      {selected ? <CheckCircle2 className="w-4 h-4" /> : letter}
                    </span>
                    <span className="text-sm md:text-base text-slate-700">{q[`option${letter}`]}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="h-11"
              >
                <PrevIcon className="w-4 h-4 me-1" /> {isAr ? 'السابق' : 'Previous'}
              </Button>

              {current < questions.length - 1 ? (
                <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="h-11">
                  {isAr ? 'التالي' : 'Next'} <NextIcon className="w-4 h-4 ms-1" />
                </Button>
              ) : (
                <Button onClick={attemptSubmit} className="h-11 bg-emerald-600 hover:bg-emerald-700">
                  <Send className="w-4 h-4 me-1.5" /> {isAr ? 'تسليم الامتحان' : 'Submit Exam'}
                </Button>
              )}
            </div>
          </Card>
        </main>

        <aside className="lg:sticky lg:top-28 h-fit">
          <Card className="p-4">
            <div className="text-xs font-semibold text-slate-900 mb-3">{isAr ? 'قائمة الأسئلة' : 'Questions List'}</div>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-2">
              {questions.map((_, i) => {
                const isCurrent = i === current;
                const isAnswered = !!answers[i];
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      'h-9 rounded-lg text-xs font-semibold transition-all border',
                      isCurrent
                        ? 'bg-slate-900 text-white border-slate-900'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-900" /> {isAr ? 'الحالي' : 'Current'}</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> {isAr ? 'تمت الإجابة' : 'Answered'}</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-white border border-slate-300" /> {isAr ? 'غير مجاب' : 'Unanswered'}</div>
            </div>
            {current === questions.length - 1 && (
              <Button onClick={attemptSubmit} className="w-full mt-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-xs">
                <Send className="w-3.5 h-3.5 me-1" /> {isAr ? 'تسليم' : 'Submit'}
              </Button>
            )}
          </Card>
        </aside>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'تأكيد التسليم' : 'Confirm Submission'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'هل أنت تأكيد من إرسال إجاباتك وإنهاء الامتحان؟ لا يمكنك تعديل إجاباتك بعد التسليم.'
                : 'Are you sure you want to submit your exam? You will not be able to change your answers.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => { e.preventDefault(); doSubmit(); }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <Send className="w-4 h-4 me-1.5" />}
              {isAr ? 'تأكيد الإرسال' : 'Submit Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}