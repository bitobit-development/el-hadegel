import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function QuestionnaireNotFound() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-right text-red-900">
          שאלון לא נמצא
        </AlertTitle>
        <AlertDescription className="text-right text-red-800">
          השאלון שביקשת אינו קיים או אינו זמין יותר.
          <br />
          ייתכן שהקישור שגוי או שהשאלון הוסר.
        </AlertDescription>
      </Alert>

      <div className="mt-6 text-center">
        <Button asChild>
          <Link href="/">חזרה לדף הבית</Link>
        </Button>
      </div>
    </div>
  );
}
