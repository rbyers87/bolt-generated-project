import React, { useEffect, useState } from 'react';
    import { supabase } from '../lib/supabase';
    import { format } from 'date-fns';
    import { DateSelector } from '../components/dashboard/DateSelector';
    import { LoadingSpinner } from '../components/common/LoadingSpinner';
    import type { Workout, WorkoutExercise } from '../types/workout';
    import { WeeklyExercises } from '../components/weekly/WeeklyExercises';
    import { RecentWorkouts } from '../components/dashboard/RecentWorkouts';
    import { Dumbbell } from 'lucide-react';
    import { Link } from 'react-router-dom';

    interface CompletedExercise {
      exercise_id: string;
      completed_at: string;
    }

    export default function Dashboard() {
      const [wodWorkout, setWodWorkout] = useState<Workout | null>(null);
      const [loading, setLoading] = useState(true);
      const [selectedDate, setSelectedDate] = useState(new Date());
      const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
      const [refreshKey, setRefreshKey] = useState(0);
      const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

      useEffect(() => {
        async function fetchWOD() {
          try {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');

            const { data, error } = await supabase
              .from('workouts')
              .select(`
                *,
                workout_exercises (
                  *,
                  exercise:exercises (*)
                )
              `)
              .eq('is_wod', true)
              .eq('scheduled_date', formattedDate)
              .limit(1);

            if (error) throw error;
            setWodWorkout(data?.[0] || null);
            setExercises(data?.[0]?.workout_exercises || []);
          } catch (error) {
            console.error('Error fetching WOD:', error);
          } finally {
            setLoading(false);
          }
        }

        fetchWOD();
      }, [selectedDate, refreshKey]);

      const handleWorkoutComplete = (completed: CompletedExercise[]) => {
        setCompletedExercises(completed);
        setRefreshKey(prevKey => prevKey + 1);
      };

      if (loading) return <LoadingSpinner />;

      return (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <DateSelector
                selectedDate={selectedDate}
                onChange={setSelectedDate}
              />
              {wodWorkout ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900">Workout of the Day</h2>
                  <h3 className="text-xl font-semibold text-gray-900">{wodWorkout.name}</h3>
                  {wodWorkout.description && (
                    <p className="text-gray-600 mt-1">{wodWorkout.description}</p>
                  )}
                  <div className="space-y-3">
                    {exercises?.map((exercise) => (
                      <div key={exercise.id} className="flex items-center justify-between py-2 border-t border-gray-100">
                        <div className="flex items-center">
                          <Dumbbell className="h-5 w-5 text-indigo-600 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{exercise.exercise.name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/workouts"
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Go to Workouts Page
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900">Workout of the Day</h2>
                  <p>No workout scheduled for today.</p>
                </div>
              )}
              <RecentWorkouts onWorkoutComplete={handleWorkoutComplete} />
            </div>
            <div className="space-y-4">
              <WeeklyExercises completedExercises={completedExercises} />
            </div>
          </div>
        </div>
      );
    }
