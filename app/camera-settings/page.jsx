import { redirect } from 'next/navigation';
import ModeCard from '../../components/ModeCard.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { getSession } from '../../lib/auth.js';
import { getAllRecipesForModeEditor, getUserModeAssignments } from '../../lib/mode-slot-assignments.js';
import { clearModeSlotAssignment, upsertModeSlotAssignment } from './actions.js';

export const metadata = {
    title: 'Camera Settings'
};

const MODE_POSITIONS = [
    { position: 'c1', label: 'C1' },
    { position: 'c2', label: 'C2' },
    { position: 'c3', label: 'C3' },
    { position: 'c4', label: 'C4' },
    { position: 'c5', label: 'C5' },
    { position: 'pasmb', label: 'P/A/S/M/B' }
];

export default async function Page() {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
        redirect('/login?redirectTo=%2Fcamera-settings');
    }

    const [assignments, allRecipes] = await Promise.all([
        getUserModeAssignments(user.id),
        getAllRecipesForModeEditor()
    ]);

    // Group assignments by modePosition
    const assignmentsByPosition = {};
    for (const assignment of assignments) {
        if (!assignmentsByPosition[assignment.modePosition]) {
            assignmentsByPosition[assignment.modePosition] = [];
        }
        assignmentsByPosition[assignment.modePosition].push(assignment);
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Camera Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Track which recipes are loaded in each mode dial position and color profile slot on your OM-3.
                    </p>
                </CardContent>
            </Card>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(550px, 1fr))' }}>
                {MODE_POSITIONS.map(({ position, label }) => (
                    <ModeCard
                        key={position}
                        modePosition={position}
                        label={label}
                        slots={assignmentsByPosition[position] ?? []}
                        allRecipes={allRecipes}
                        upsertAction={upsertModeSlotAssignment}
                        clearAction={clearModeSlotAssignment}
                    />
                ))}
            </div>
        </div>
    );
}
