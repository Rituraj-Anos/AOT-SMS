"""Generate attendance seed SQL for AOT-SMS CSE1 Sem4."""
from datetime import date, timedelta

# Student ID mapping: roll_no -> student_id
STUDENTS = {
    '24CSE001': 9, '24CSE002': 10, '24CSE003': 11, '24CSE004': 12,
    '24CSE005': 13, '24CSE006': 14, '24CSE007': 15, '24CSE008': 16,
    '24CSE009': 17, '24CSE010': 18, '24CSE011': 19, '24CSE012': 20,
    '24CSE013': 21, '24CSE014': 22, '24CSE015': 23, '24CSE016': 24,
    '24CSE017': 25, '24CSE018': 26, '24CSE019': 27, '24CSE020': 28,
    '24CSE021': 29, '24CSE022': 30, '24CSE023': 31, '24CSE024': 32,
    '24CSE026': 33, '24CSE027': 4, '24CSE028': 5, '24CSE029': 34,
    '24CSE031': 35, '24CSE032': 36, '24CSE033': 37, '24CSE034': 38,
    '24CSE035': 39, '24CSE036': 40, '24CSE037': 41, '24CSE038': 42,
    '24CSE039': 43, '24CSE040': 44, '24CSE041': 8, '24CSE042': 45,
    '24CSE043': 46, '24CSE044': 47, '24CSE045': 48, '24CSE046': 49,
    '24CSE047': 50, '24CSE048': 51, '24CSE049': 52, '24CSE050': 53,
    '24CSE051': 54, '24CSE052': 55, '24CSE053': 56,
    'L204': 60, 'L205': 61, 'L206': 62, 'L207': 63, 'L208': 64,
    'T006': 65, 'T063': 66, 'T098': 67, 'T191': 68,
}

# Subject mapping: code -> (subject_id, teacher_id, held_x, held_y)
# held_x = X batch (roll 1-26 + T*), held_y = Y batch (roll 27-53 + L*)
SUBJECTS = {
    'PCC-CS401': (1, 5, 20, 20),
    'PCC-CS402': (2, 15, 21, 21),
    'PCC-CS403': (3, 14, 17, 17),
    'PCC-CS404': (4, 3, 20, 20),
    'BSC-401':   (5, 4, 8, 8),
    'MC-401':    (6, 17, 5, 5),
    'PCC-CS492': (7, 2, 8, 12),
    'PCC-CS494': (8, 3, 12, 10),
}

# X batch rolls
X_BATCH = [
    '24CSE001','24CSE002','24CSE003','24CSE004','24CSE005','24CSE006',
    '24CSE007','24CSE008','24CSE009','24CSE010','24CSE011','24CSE012',
    '24CSE013','24CSE014','24CSE015','24CSE016','24CSE017','24CSE018',
    '24CSE019','24CSE020','24CSE021','24CSE022','24CSE023','24CSE024',
    '24CSE026','T006','T063','T098','T191',
]
# Y batch rolls
Y_BATCH = [
    '24CSE027','24CSE028','24CSE029','24CSE031','24CSE032','24CSE033',
    '24CSE034','24CSE035','24CSE036','24CSE037','24CSE038','24CSE039',
    '24CSE040','24CSE041','24CSE042','24CSE043','24CSE044','24CSE045',
    '24CSE046','24CSE047','24CSE048','24CSE049','24CSE050','24CSE051',
    '24CSE052','24CSE053','L204','L205','L206','L207','L208',
]

# Present counts per student per subject (from official sheet)
# Format: roll -> [CS401, CS402, CS403, CS404, BSC, MC, CS492, CS494]
DATA_X = {
    '24CSE001': [16,16,11,15,6,4,8,8],
    '24CSE002': [17,17,13,17,6,3,8,10],
    '24CSE003': [19,20,16,19,8,4,8,12],
    '24CSE004': [17,17,12,15,6,3,8,10],
    '24CSE005': [9,8,9,10,4,5,2,6],
    '24CSE006': [20,21,17,20,8,5,8,12],
    '24CSE007': [16,16,12,13,6,3,8,10],
    '24CSE008': [20,20,16,20,8,5,8,12],
    '24CSE009': [15,16,14,15,4,4,8,10],
    '24CSE010': [17,17,13,16,6,3,8,10],
    '24CSE011': [15,17,12,15,6,5,6,8],
    '24CSE012': [14,16,11,16,6,3,8,8],
    '24CSE013': [17,17,13,16,6,4,8,10],
    '24CSE014': [16,18,13,16,6,3,8,10],
    '24CSE015': [16,17,10,14,6,4,8,10],
    '24CSE016': [20,16,14,20,8,2,8,12],
    '24CSE017': [15,17,13,16,8,3,8,10],
    '24CSE018': [16,15,15,15,4,4,8,12],
    '24CSE019': [17,19,17,18,8,3,8,10],
    '24CSE020': [12,11,10,8,4,4,8,6],
    '24CSE021': [19,20,15,18,8,4,8,10],
    '24CSE022': [15,17,14,17,4,4,8,12],
    '24CSE023': [15,16,12,15,6,4,8,10],
    '24CSE024': [16,12,13,13,2,2,8,12],
    '24CSE026': [20,21,16,20,8,4,8,12],
    'T006': [16,15,9,14,2,3,8,10],
    'T063': [16,20,14,18,6,5,8,10],
    'T098': [19,20,17,20,8,4,8,12],
    'T191': [16,17,14,14,6,5,8,10],
}

DATA_Y = {
    '24CSE027': [14,15,12,14,4,4,8,4],
    '24CSE028': [19,20,16,19,8,4,12,10],
    '24CSE029': [18,19,16,16,8,4,8,10],
    '24CSE031': [14,16,14,14,6,3,8,6],
    '24CSE032': [17,18,13,16,8,4,10,8],
    '24CSE033': [19,19,15,18,8,5,12,10],
    '24CSE034': [16,14,12,13,6,2,8,8],
    '24CSE035': [15,16,12,12,6,4,10,6],
    '24CSE036': [17,16,13,16,8,4,10,6],
    '24CSE037': [14,13,11,16,6,2,10,8],
    '24CSE038': [18,17,15,18,6,5,12,10],
    '24CSE039': [15,14,13,14,6,4,10,8],
    '24CSE040': [14,15,13,13,8,3,6,10],
    '24CSE041': [14,15,12,14,4,4,8,4],
    '24CSE042': [16,16,14,15,4,4,12,8],
    '24CSE043': [13,17,14,12,6,5,12,8],
    '24CSE044': [14,18,14,18,8,4,12,10],
    '24CSE045': [12,17,12,15,8,3,8,8],
    '24CSE046': [11,15,13,15,6,5,10,4],
    '24CSE047': [19,20,17,19,8,4,10,10],
    '24CSE048': [17,17,14,18,6,5,12,10],
    '24CSE049': [15,18,14,15,8,5,12,10],
    '24CSE050': [15,15,8,14,6,3,10,8],
    '24CSE051': [15,14,12,17,6,4,12,8],
    '24CSE052': [14,17,15,17,8,4,12,10],
    '24CSE053': [14,16,15,15,6,2,10,8],
    'L204': [16,15,11,15,4,3,12,10],
    'L205': [10,13,12,10,4,2,8,6],
    'L206': [8,11,9,7,4,2,6,10],
    'L207': [14,13,12,15,6,2,12,10],
    'L208': [14,14,12,15,6,2,12,10],
}

# Subject order in data arrays
SUBJ_ORDER = ['PCC-CS401','PCC-CS402','PCC-CS403','PCC-CS404','BSC-401','MC-401','PCC-CS492','PCC-CS494']

START_DATE = date(2026, 1, 15)

def gen_dates(held):
    """Generate `held` dates at ~3-day intervals starting from START_DATE."""
    dates = []
    for i in range(held):
        d = START_DATE + timedelta(days=i * 3)
        dates.append(d.isoformat())
    return dates

lines = []
lines.append("-- Auto-generated attendance seed data for CSE1 Sem4")
lines.append("-- Clear existing attendance for these subjects")
lines.append("DELETE FROM attendance WHERE subject_id IN (1,2,3,4,5,6,7,8);")
lines.append("")

def process_batch(data, batch_rolls, batch_label):
    for roll in batch_rolls:
        if roll not in data:
            continue
        student_id = STUDENTS[roll]
        presents = data[roll]
        for idx, subj_code in enumerate(SUBJ_ORDER):
            subj_id, teacher_id, held_x, held_y = SUBJECTS[subj_code]
            held = held_x if roll in X_BATCH else held_y
            present_count = presents[idx]
            # Clamp present to held
            present_count = min(present_count, held)
            dates = gen_dates(held)
            for d_idx, d in enumerate(dates):
                status = 'P' if d_idx < present_count else 'A'
                lines.append(
                    f"INSERT INTO attendance (student_id, subject_id, attendance_date, status, marked_by) "
                    f"VALUES ({student_id},{subj_id},'{d}','{status}',{teacher_id}) "
                    f"ON DUPLICATE KEY UPDATE status=VALUES(status);"
                )

process_batch(DATA_X, X_BATCH, 'X')
process_batch(DATA_Y, Y_BATCH, 'Y')

lines.append("")
lines.append("-- Done. Total inserts: " + str(len([l for l in lines if l.startswith("INSERT")])))

with open(r'c:\coding\AOT-SMS\database\seed_attendance.sql', 'w') as f:
    f.write('\n'.join(lines))

print(f"Generated {len([l for l in lines if l.startswith('INSERT')])} INSERT statements")
