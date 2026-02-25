/*
 * Orange Pi 3B v1.1 — Open Case with 50mm Fan
 *
 * Design notes:
 * - 50mm fan top-mounted, exhausting upward (board below, screen above on standoffs)
 * - Fan connects to Pi's 2-pin fan header (no extra wiring)
 * - All ports accessible
 * - Screen mounts on 4x M2.5 standoffs above the board (not part of this case)
 * - Snap-fit lid (fan surround). No screws for lid.
 * - 4x M3 screws hold body base together (optional)
 *
 * Print orientation:
 *   Body — flat side down, no supports needed
 *   Lid  — fan-face down, no supports needed
 *
 * Board mounting holes: OPi3B v1.1 = 52mm × 37mm spacing from board corner (4mm inset)
 */

// ── Parameters ────────────────────────────────────────────────────────────────
board_x     = 60.0;   // PCB length
board_y     = 45.0;   // PCB width
board_z     = 1.6;    // PCB thickness
standoff_h  = 4.0;    // clearance under board (room for SMD on bottom)
comp_h      = 20.0;   // max component height above PCB (SoC + heatsink if any)
wall        = 2.2;    // wall thickness
floor_t     = 1.8;    // floor thickness
corner_r    = 3.5;    // outer corner radius

// Fan
fan_sz      = 50;     // fan body size mm
fan_hole_d  = 47;     // airflow aperture diameter
fan_screw_d = 41;     // M4 mounting hole spacing (standard 50mm fan)
fan_screw_r = 2.2;    // M4 clearance

// Snap fit
snap_depth  = 0.7;
snap_h      = 3.5;

$fn = 56;

// ── Derived ───────────────────────────────────────────────────────────────────
outer_x   = board_x + wall * 2;
outer_y   = board_y + wall * 2;
body_h    = floor_t + standoff_h + board_z + comp_h;
pcb_z     = floor_t + standoff_h;            // Z of bottom of PCB
port_z    = pcb_z + board_z;                 // Z of top of PCB = port base

// ── Rounded box ───────────────────────────────────────────────────────────────
module rbox(x, y, z, r=corner_r) {
    hull()
        for (dx=[r, x-r], dy=[r, y-r])
            translate([dx, dy, 0]) cylinder(h=z, r=r, $fn=32);
}

// ── Port cutout (centred, flush through wall) ─────────────────────────────────
module slot(w, h, depth=wall+2) {
    translate([-w/2, -1, 0]) cube([w, depth, h]);
}

// ══════════════════════════════════════════════════════════════════════════════
// BODY
// ══════════════════════════════════════════════════════════════════════════════
module body() {
    difference() {
        rbox(outer_x, outer_y, body_h);

        // ── Inner cavity ──────────────────────────────────────────────────────
        translate([wall, wall, floor_t])
            cube([board_x, board_y, body_h]);

        // ── Snap groove at top ────────────────────────────────────────────────
        translate([wall - snap_depth, wall - snap_depth, body_h - snap_h - 0.5])
            cube([board_x + snap_depth*2, board_y + snap_depth*2, snap_h]);

        // ══ PORT CUTOUTS ══════════════════════════════════════════════════════
        // Reference: port_z = base of ports above PCB top surface
        // OPi3B port layout (approximate, v1.1):
        //
        // X=0 face (short edge, left when ports face you):
        //   USB-C power  ~y=5..15  from board corner
        //   USB-A ×2     ~y=19..35 stacked
        //
        // X=outer_x face (short edge, right):
        //   microSD      ~y=32..46, flush with floor
        //
        // Y=outer_y face (long edge, back):
        //   HDMI         ~x=8..26
        //   Ethernet     ~x=30..50
        //
        // Y=0 face (long edge, front):
        //   26-pin header ~x=4..57, tall

        // USB-C power (short left face, x=0)
        translate([0, wall + 8, port_z + 0.5])
            rotate([0, 90, 0]) slot(10, 5);

        // USB-A × 2 (short left face, x=0) — stacked side by side
        translate([0, wall + 20, port_z + 0.5])
            rotate([0, 90, 0]) slot(14, 8);
        translate([0, wall + 35, port_z + 0.5])
            rotate([0, 90, 0]) slot(14, 8);

        // microSD (short right face, x=outer_x) — low, near floor
        translate([outer_x, wall + 35, floor_t + 0.5])
            rotate([0, -90, 0]) slot(14, 3);

        // HDMI (long back face, y=outer_y)
        translate([wall + 12, outer_y, port_z + 0.5])
            rotate([90, 0, 0]) slot(17, 7);

        // Ethernet (long back face, y=outer_y)
        translate([wall + 38, outer_y, port_z + 0.5])
            rotate([90, 0, 0]) slot(18, 14);

        // 26-pin GPIO header (long front face, y=0) — full width slot
        translate([wall + 4, 0, port_z + 0.5])
            rotate([90, 0, 0]) slot(52, 12);

        // ── Bottom vents (passive intake under board) ─────────────────────────
        for (i=[0:4])
            translate([wall + 5 + i*10, outer_y/2 - 6, -0.5])
                cube([6, 12, floor_t + 1]);
    }

    // ── Board standoffs ───────────────────────────────────────────────────────
    // OPi3B mounting holes: 52×37mm pattern, 4mm inset from board corner
    for (pos=[[4,4],[4,41],[56,4],[56,41]])
        translate([wall + pos[0], wall + pos[1], floor_t])
            difference() {
                cylinder(h=standoff_h, d=5.5);
                cylinder(h=standoff_h + 1, d=2.5);
            }
}

// ══════════════════════════════════════════════════════════════════════════════
// LID (fan surround)
// Sits on top of body, snap-fits in, holds 50mm fan
// Fan blows upward through the lid into the screen standoff gap
// ══════════════════════════════════════════════════════════════════════════════
module lid() {
    lid_depth = 12;  // enough for fan thickness (10mm) + 2mm recess floor

    difference() {
        union() {
            rbox(outer_x, outer_y, lid_depth);

            // Snap lip (clicks into body groove)
            translate([wall - snap_depth, wall - snap_depth, lid_depth])
                difference() {
                    cube([board_x + snap_depth*2, board_y + snap_depth*2, snap_h + 0.5]);
                    translate([snap_depth, snap_depth, -0.5])
                        cube([board_x, board_y, snap_h + 2]);
                }
        }

        // Inner recess (fan sits here)
        translate([wall, wall, wall])
            cube([board_x, board_y, lid_depth]);

        // 50mm fan airflow hole
        translate([outer_x/2, outer_y/2, -0.5])
            cylinder(h=wall+1, d=fan_hole_d);

        // Fan screw holes (M4, 41mm spacing)
        for (dx=[-fan_screw_d/2, fan_screw_d/2])
            for (dy=[-fan_screw_d/2, fan_screw_d/2])
                translate([outer_x/2+dx, outer_y/2+dy, -0.5])
                    cylinder(h=wall+1, r=fan_screw_r);

        // Side vent slots (exhaust path around fan edges)
        for (i=[0:2]) {
            // Left/right walls
            translate([-0.5, wall+4+i*13, wall+2])
                cube([wall+1, 9, 6]);
            translate([outer_x-wall-0.5, wall+4+i*13, wall+2])
                cube([wall+1, 9, 6]);
            // Front/back walls
            translate([wall+4+i*16, -0.5, wall+2])
                cube([10, wall+1, 6]);
            translate([wall+4+i*16, outer_y-wall-0.5, wall+2])
                cube([10, wall+1, 6]);
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER — body + lid side by side for printing
// ══════════════════════════════════════════════════════════════════════════════
body();

translate([outer_x + 8, 0, 12])
    rotate([180, 0, 0])
        lid();
