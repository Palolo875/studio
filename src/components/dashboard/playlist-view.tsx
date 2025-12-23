/**
 * Playlist View - Composant pour afficher la playlist de tâches
 */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { TaskList } from './task-list';
import { Recommendations } from './recommendations';
import type { Task } from '@/lib/types';

interface PlaylistViewProps {
    tasks: Task[];
    isGenerating: boolean;
    playlistMessage: string;
    onToggleCompletion: (taskId: string) => void;
}

export function PlaylistView({
    tasks,
    isGenerating,
    playlistMessage,
    onToggleCompletion,
}: PlaylistViewProps) {
    return (
        <div className="space-y-8">
            {/* Energy recommendations */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Ton énergie du jour</h2>
                </div>
                <Recommendations tasks={tasks} />
            </div>

            {/* Task list */}
            <div>
                <p className="text-lg font-medium text-foreground mb-6">
                    {playlistMessage}
                </p>

                <div className="overflow-hidden relative min-h-[100px]">
                    <AnimatePresence mode="wait">
                        {isGenerating ? (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                    <p className="text-muted-foreground">
                                        Génération de votre playlist...
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="tasks"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {tasks.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>Aucune tâche pour le moment.</p>
                                        <p className="text-sm mt-2">
                                            Commencez par ajouter des tâches à votre liste.
                                        </p>
                                    </div>
                                ) : (
                                    <TaskList
                                        tasks={tasks}
                                        onToggleCompletion={onToggleCompletion}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
