import { useState } from 'react';
import { UserPlus, FileText, Loader2 } from 'lucide-react';
import MemberForm from './MemberForm';
import {
  TRAINING_MODALITIES,
  STUDY_PROGRAMS,
  DOCUMENT_TYPES,
  MAX_MEMBERS,
  MAX_REVIEWS,
  MAX_REQUESTS_PER_WEEK,
  type Member,
  type RequestFormData,
} from '../types';
import { supabase, STORAGE_BUCKETS } from '../lib/supabase';
import {
  getOrCreateCurrentWeek,
  getNextWeek,
  getAvailableSlots,
  uploadFile,
  formatDate,
} from '../lib/utils';

export default function RequestForm() {
  const [formData, setFormData] = useState<RequestFormData>({
    trainingModality: '',
    studyProgram: '',
    documentType: '',
    reviewNumber: 1,
    document: null,
    members: [
      { fullName: '', institutionalEmail: '', phoneNumber: '', paymentReceipt: null },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [queueInfo, setQueueInfo] = useState<{
    queueNumber: number;
    weekStart: string;
    weekEnd: string;
    isNextWeek: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMemberChange = (
    index: number,
    field: keyof Member,
    value: string | File | null
  ) => {
    const newMembers = [...formData.members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFormData({ ...formData, members: newMembers });
  };

  const addMember = () => {
    if (formData.members.length < MAX_MEMBERS) {
      setFormData({
        ...formData,
        members: [
          ...formData.members,
          { fullName: '', institutionalEmail: '', phoneNumber: '', paymentReceipt: null },
        ],
      });
    }
  };

  const removeMember = (index: number) => {
    const newMembers = formData.members.filter((_, i) => i !== index);
    setFormData({ ...formData, members: newMembers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.document) {
        throw new Error('Debe adjuntar el documento a revisar');
      }

      const membersWithoutReceipt = formData.members.filter(
        (m) => !m.paymentReceipt
      );
      if (membersWithoutReceipt.length > 0) {
        throw new Error('Todos los integrantes deben adjuntar su comprobante de pago');
      }

      let currentWeek = await getOrCreateCurrentWeek();
      if (!currentWeek) {
        throw new Error('Error al obtener la semana actual');
      }

      let availableSlots = await getAvailableSlots(currentWeek);
      let isNextWeek = false;

      if (availableSlots <= 0) {
        const nextWeek = await getNextWeek();
        if (!nextWeek) {
          throw new Error('Error al crear la siguiente semana');
        }
        currentWeek = nextWeek;
        availableSlots = await getAvailableSlots(currentWeek);
        isNextWeek = true;
      }

      const { count: currentCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('week_id', currentWeek.id);

      const queueNumber = (currentCount || 0) + 1;

      const timestamp = Date.now();
      const documentPath = `${timestamp}_${formData.document.name}`;
      const uploadedDocPath = await uploadFile(
        formData.document,
        STORAGE_BUCKETS.DOCUMENTS,
        documentPath
      );

      if (!uploadedDocPath) {
        throw new Error('Error al subir el documento');
      }

      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert({
          week_id: currentWeek.id,
          queue_number: queueNumber,
          training_modality: formData.trainingModality,
          study_program: formData.studyProgram,
          document_type: formData.documentType,
          review_number: formData.reviewNumber,
          document_file_path: uploadedDocPath,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError || !requestData) {
        throw new Error('Error al crear la solicitud');
      }

      for (let i = 0; i < formData.members.length; i++) {
        const member = formData.members[i];
        if (!member.paymentReceipt) continue;

        const receiptPath = `${timestamp}_member${i + 1}_${member.paymentReceipt.name}`;
        const uploadedReceiptPath = await uploadFile(
          member.paymentReceipt,
          STORAGE_BUCKETS.RECEIPTS,
          receiptPath
        );

        if (!uploadedReceiptPath) {
          throw new Error(`Error al subir el comprobante del integrante ${i + 1}`);
        }

        const { error: memberError } = await supabase
          .from('request_members')
          .insert({
            request_id: requestData.id,
            full_name: member.fullName,
            institutional_email: member.institutionalEmail,
            phone_number: member.phoneNumber,
            payment_receipt_path: uploadedReceiptPath,
          });

        if (memberError) {
          throw new Error(`Error al registrar el integrante ${i + 1}`);
        }
      }

      setQueueInfo({
        queueNumber,
        weekStart: currentWeek.start_date,
        weekEnd: currentWeek.end_date,
        isNextWeek,
      });
      setSubmitSuccess(true);

      setFormData({
        trainingModality: '',
        studyProgram: '',
        documentType: '',
        reviewNumber: 1,
        document: null,
        members: [
          { fullName: '', institutionalEmail: '', phoneNumber: '', paymentReceipt: null },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la solicitud');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess && queueInfo) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Solicitud enviada exitosamente
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-lg font-semibold text-blue-900 mb-2">
              Su número en la cola: {queueInfo.queueNumber}
            </p>
            <p className="text-gray-700">
              {queueInfo.isNextWeek ? (
                <>
                  Su solicitud será atendida en la siguiente semana de revisión:
                  <br />
                  <span className="font-medium">
                    {formatDate(queueInfo.weekStart)} - {formatDate(queueInfo.weekEnd)}
                  </span>
                </>
              ) : (
                <>
                  Semana de revisión:
                  <br />
                  <span className="font-medium">
                    {formatDate(queueInfo.weekStart)} - {formatDate(queueInfo.weekEnd)}
                  </span>
                </>
              )}
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            Recibirá una notificación por correo electrónico cuando su revisión esté lista.
          </p>
          <button
            onClick={() => {
              setSubmitSuccess(false);
              setQueueInfo(null);
            }}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
          >
            Enviar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="training-modality"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Modalidad de Formación <span className="text-red-500">*</span>
            </label>
            <select
              id="training-modality"
              required
              value={formData.trainingModality}
              onChange={(e) =>
                setFormData({ ...formData, trainingModality: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Seleccione una opción</option>
              {Object.entries(TRAINING_MODALITIES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="study-program"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Programa de Estudios <span className="text-red-500">*</span>
            </label>
            <select
              id="study-program"
              required
              value={formData.studyProgram}
              onChange={(e) => setFormData({ ...formData, studyProgram: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Seleccione una opción</option>
              {Object.entries(STUDY_PROGRAMS).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="document-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tipo de Documento <span className="text-red-500">*</span>
            </label>
            <select
              id="document-type"
              required
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Seleccione una opción</option>
              {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="review-number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Número de Revisión <span className="text-red-500">*</span>
            </label>
            <select
              id="review-number"
              required
              value={formData.reviewNumber}
              onChange={(e) =>
                setFormData({ ...formData, reviewNumber: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {Array.from({ length: MAX_REVIEWS }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  Revisión {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="document"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Documento a Revisar <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="document"
            required
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setFormData({ ...formData, document: file });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          />
          <p className="mt-1 text-sm text-gray-500">Formato: PDF o Word</p>
          {formData.document && (
            <p className="mt-2 text-sm text-green-600 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              {formData.document.name}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Integrantes del Grupo de Investigación
            </h3>
            {formData.members.length < MAX_MEMBERS && (
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Agregar Integrante
              </button>
            )}
          </div>

          <div className="space-y-4">
            {formData.members.map((member, index) => (
              <MemberForm
                key={index}
                member={member}
                index={index}
                canRemove={formData.members.length > 1}
                onChange={handleMemberChange}
                onRemove={removeMember}
              />
            ))}
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Puede agregar hasta {MAX_MEMBERS} integrantes. Cada integrante debe adjuntar su
            comprobante de pago.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Información importante:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Se aceptan máximo {MAX_REQUESTS_PER_WEEK} solicitudes por semana</li>
            <li>Cada grupo tiene derecho a hasta {MAX_REVIEWS} revisiones</li>
            <li>El pago se realiza por cada integrante del grupo</li>
            <li>Si la capacidad de la semana está completa, su solicitud será programada para la siguiente semana</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando solicitud...
            </>
          ) : (
            'Enviar Solicitud'
          )}
        </button>
      </div>
    </form>
  );
}
