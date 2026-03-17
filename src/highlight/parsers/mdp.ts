import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';

const MDP_KEYWORDS = new Set([
  'include','define','integrator','tinit','dt','nsteps','init-step','simulation-part',
  'mts','mts-levels','mts-level2-factor','comm-mode','nstcomm','comm-grps','bd-fric',
  'ld-seed','emtol','emstep','nstcgsteep','nbfgscorr','niter','fcstep','rtpi',
  'nstxout','nstvout','nstfout','nstlog','nstcalcenergy','nstenergy',
  'compressed-x-precision','nstxout-compressed','compressed-x-grps','energygrps',
  'cutoff-scheme','nstlist','pbc','periodic-molecules','verlet-buffer-tolerance',
  'rlist','coulombtype','coulomb-modifier','rcoulomb-switch','rcoulomb',
  'epsilon-r','epsilon-rf','vdwtype','vdw-modifier','rvdw','rvdw-switch','vdw',
  'DispCorr','table-extension','energygrp-table','fourierspacing',
  'fourier-nx','fourier-ny','fourier-nz','pme-order','ewald-rtol-lj',
  'lj-pme-comb-rule','ewald-geometry','epsilon-surface',
  'tcoupl','nsttcouple','nh-chain-length','print-nose-hoover-chain-variables',
  'tc-grps','tau-t','ref-t','pcoupl','pcoupltype','nstcouple','tau-p',
  'compressibility','ref-p','refcoord-scaling',
  'annealing','annealing-npoints','annealing-time','annealing-temp',
  'gen-vel','gen-temp','gen-seed',
  'constraints','constraint-algorithm','continuation','shake-tol',
  'lincs-order','lincs-iter','lincs-warnangle','morse',
  'energygrp-excl','nwall','wall-atomtype','wall-type','wall-r-linpot',
  'wall-density','wall-ewald-zfac',
  'pull','pull-cylinder-r','pull-constr-tol','pull-print-com',
  'pull-print-components','pull-nstxout','pull-nstfout',
  'pull-ncoords','pull-ngroups',
  'awh','awh-potential','awh-seed','awh-nstout','awh-nstsample',
  'awh-nsamples-update','awh-nbias',
  'rotation','disre','disre-weighting',
  'free-energy','acc-grps','freezegrps','freezedim',
  'cos-acceleration','deform','userint1','userint2','userint3','userint4',
  'userreal1','userreal2','userreal3','userreal4',
  'sc-alpha','sc-power','sc-r-power','sc-sigma',
  'couple-moltype','couple-lambda0','couple-lambda1','couple-intramol',
  'init-lambda','delta-lambda','init-lambda-state','fep-lambdas',
  'mass-lambdas','coul-lambdas','vdw-lambdas','bonded-lambdas',
  'restraint-lambdas','temperature-lambdas','calc-lambda-neighbors',
  'sc-coul','nstdhdl','dhdl-derivatives','dhdl-print-energy',
  'separate-dhdl-file','dh-hist-size','dh-hist-spacing',
  'simulated-tempering','simulated-tempering-scaling','sim-temp-low','sim-temp-high',
  'nst-transition-matrix','symmetrized-transition-matrix','mininum-var-min',
  'weight-equil-wl-delta','lmc-seed','mc-temperature','lmc-gibbsdelta',
  'lmc-forced-nstart','lmc-move','lmc-weights-equil','weight-equil-number-all-lambda',
  'weight-equil-number-samples','weight-equil-number-steps',
  'weight-equil-wl-delta','weight-equil-count-ratio',
  'wl-scale','wl-ratio','init-wl-delta','wl-oneovert',
]);

export function parseMdp(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  for (let i = vStart; i <= vEnd && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    const trimmed = line.trim();

    // Full comment line
    if (trimmed.startsWith(';')) {
      res.comment.push(new vscode.Range(i, line.indexOf(';'), i, line.length));
      continue;
    }

    // Empty line
    if (!trimmed) continue;

    // Key = value ; comment
    const eqIdx = line.indexOf('=');
    if (eqIdx >= 0) {
      // Keyword before =
      const key = line.substring(0, eqIdx).trim();
      if (key && MDP_KEYWORDS.has(key)) {
        const keyStart = line.indexOf(key);
        res.mdpKeyword.push(new vscode.Range(i, keyStart, i, keyStart + key.length));
      }

      // Value after =
      const afterEq = line.substring(eqIdx + 1);
      const commentIdx = afterEq.indexOf(';');
      const valueStr = (commentIdx >= 0 ? afterEq.substring(0, commentIdx) : afterEq).trim();
      if (valueStr) {
        const valStart = line.indexOf(valueStr, eqIdx + 1);
        res.coord.push(new vscode.Range(i, valStart, i, valStart + valueStr.length));
      }

      // Inline comment
      if (commentIdx >= 0) {
        const absComment = eqIdx + 1 + commentIdx;
        res.comment.push(new vscode.Range(i, absComment, i, line.length));
      }
    }
  }
  return res;
}
