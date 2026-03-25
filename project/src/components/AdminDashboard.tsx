import { useState, useEffect } from 'react';
import {
  LogOut,
  Calendar,
  Download,
  Users,
  FileText,
  Loader2,
  Plus,
  Save,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, STORAGE_BUCKETS } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import type { Week, Request, RequestMember } from '../types';

interface RequestWithMembers extends Request {
  members: RequestMember[];
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [requests, setRequests] = useState<RequestWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'weeks'>('requests');

  const [newWeek, setNewWeek] = useState({
    startDate: '',
    endDate: '',
    reservedSlots: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: weeksData } = await supabase
        .from('weeks')
        .select('*')
        .order('start_date', { ascending: false });

      const { data: requestsData } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (weeksData) setWeeks(weeksData);

      if (requestsData) {
        const requestsWithMembers = await Promise.all(
          requestsData.map(async (request) => {
            const { data: membersData } = await supabase
              .from('request_members')
              .select('*')
              .eq('request_id', request.id);

            return {
              ...request,
              members: membersData || [],
            };
          })
        );
        setRequests(requestsWithMembers);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWeek = async () => {
    if (!newWeek.startDate || !newWeek.endDate) {
      alert('Por favor complete las fechas');
      return;
    }

    try {
      const { error } = await supabase.from('weeks').insert({
        start_date: newWeek.startDate,
        end_date: newWeek.endDate,
        reserved_slots: newWeek.reservedSlots,
      });

      if (error) throw error;

      setNewWeek({ startDate: '', endDate: '', reservedSlots: 0 });
      await loadData();
    } catch (error) {
      console.error('Error creating week:', error);
      alert('Error al crear la semana');
    }
  };

  const updateWeekReservedSlots = async (weekId: string, slots: number) => {
    try {
      const { error } = await supabase
        .from('weeks')
        .update({ reserved_slots: slots })
        .eq('id', weekId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating week:', error);
      alert('Error al actualizar la semana');
    }
  };

  const downloadFile = async (bucket: string, path: string, filename?: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw error;

    const url = URL.createObjectURL(data);

    const a = document.createElement('a');
    a.href = url;

    // Obtener nombre real del archivo si no existe
    const realFileName = filename || path.split('/').pop() || 'archivo';

    a.download = realFileName;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('Error al descargar el archivo');
  }
};

  const deleteRequest = async (requestId: string) => {
    if (!confirm('¿Está seguro de eliminar esta solicitud?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Error al eliminar la solicitud');
    }
  };

  const getWeekStats = (week: Week) => {
    const weekRequests = requests.filter((r) => r.week_id === week.id);
    return {
      total: weekRequests.length,
      available: 10 - week.reserved_slots - weekRequests.length,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img
                src="/logo-iesp-pukllasunchis.png"
                alt="EESP Pukllasunchis"
                className="h-12"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                Panel de Administración
              </h1>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'requests'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Solicitudes ({requests.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('weeks')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'weeks'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Semanas ({weeks.length})
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay solicitudes registradas
                  </p>
                ) : (
                  requests.map((request) => {
                    const week = weeks.find((w) => w.id === request.week_id);
                    return (
                      <div
                        key={request.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                                #{request.queue_number}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  request.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {request.status === 'pending' ? 'Pendiente' : 'Revisado'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Semana:{' '}
                              {week
                                ? `${formatDate(week.start_date)} - ${formatDate(
                                    week.end_date
                                  )}`
                                : 'Sin asignar'}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteRequest(request.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Modalidad de Formación
                            </p>
                            <p className="text-sm text-gray-900">
                              {request.training_modality}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Programa de Estudios
                            </p>
                            <p className="text-sm text-gray-900">
                              {request.study_program}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Tipo de Documento
                            </p>
                            <p className="text-sm text-gray-900">
                              {request.document_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Número de Revisión
                            </p>
                            <p className="text-sm text-gray-900">
                              Revisión {request.review_number}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <button
                            onClick={() =>
                              downloadFile(
                                STORAGE_BUCKETS.DOCUMENTS,
                                request.document_file_path,
                                `documento_${request.queue_number}.pdf`
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            Descargar Documento
                          </button>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Integrantes ({request.members.length})
                          </p>
                          <div className="space-y-2">
                            {request.members.map((member, idx) => (
                              <div
                                key={member.id}
                                className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {member.full_name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {member.institutional_email} | {member.phone_number}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    downloadFile(
                                      STORAGE_BUCKETS.RECEIPTS,
                                      member.payment_receipt_path,
                                      `comprobante_${request.queue_number}_miembro${
                                        idx + 1
                                      }.pdf`
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Comprobante
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'weeks' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Crear Nueva Semana
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Inicio
                      </label>
                      <input
                        type="date"
                        value={newWeek.startDate}
                        onChange={(e) =>
                          setNewWeek({ ...newWeek, startDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Fin
                      </label>
                      <input
                        type="date"
                        value={newWeek.endDate}
                        onChange={(e) =>
                          setNewWeek({ ...newWeek, endDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slots Reservados
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={newWeek.reservedSlots}
                        onChange={(e) =>
                          setNewWeek({
                            ...newWeek,
                            reservedSlots: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={createWeek}
                    className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                  >
                    Crear Semana
                  </button>
                </div>

                <div className="space-y-4">
                  {weeks.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No hay semanas registradas
                    </p>
                  ) : (
                    weeks.map((week) => {
                      const stats = getWeekStats(week);
                      return (
                        <div
                          key={week.id}
                          className="border border-gray-200 rounded-lg p-6"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {formatDate(week.start_date)} -{' '}
                                {formatDate(week.end_date)}
                              </h3>
                              <div className="flex gap-4 text-sm">
                                <span className="text-gray-600">
                                  Solicitudes: {stats.total}/10
                                </span>
                                <span className="text-gray-600">
                                  Slots Reservados: {week.reserved_slots}
                                </span>
                                <span className="text-green-600 font-medium">
                                  Disponibles: {stats.available}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">
                              Actualizar Slots Reservados:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              defaultValue={week.reserved_slots}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (value !== week.reserved_slots) {
                                  updateWeekReservedSlots(week.id, value);
                                }
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <button
                              onClick={(e) => {
                                const input = e.currentTarget
                                  .previousElementSibling as HTMLInputElement;
                                const value = parseInt(input.value) || 0;
                                updateWeekReservedSlots(week.id, value);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                              <Save className="w-4 h-4" />
                              Guardar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
