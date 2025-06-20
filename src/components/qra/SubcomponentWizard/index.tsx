import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, AppBar, Toolbar, Typography, Alert } from '@mui/material';
import { StepOne } from './StepOne';
import { StepTwo } from './StepTwo';
import { useWizardState } from './hooks/useWizardState';
import { WIZARD_STEPS, UI } from './constants';
import { validateSelections, validateStepTimes, validateNonRDTime } from './utils/validation';
import { SubcomponentSelection, SubcomponentMetrics, ModalHierarchy } from './types';

interface WizardProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    selectedSubs: Record<string, SubcomponentSelection>;
    metrics: Record<string, SubcomponentMetrics>;
    nonRD: number;
    customStepTimes: Record<string, number>;
    lockedSteps: Record<string, boolean>;
  }) => void;
  initialData?: {
    selectedSubs: Record<string, SubcomponentSelection>;
    metrics: Record<string, SubcomponentMetrics>;
    nonRD: number;
    customStepTimes: Record<string, number>;
    lockedSteps: Record<string, boolean>;
  };
  modalHierarchyState: ModalHierarchy;
}

interface StepOneProps {
  modalHierarchyState: ModalHierarchy;
  selectedModalSubs: Record<string, SubcomponentSelection>;
  setSelectedModalSubs: Dispatch<SetStateAction<Record<string, SubcomponentSelection>>>;
  modalMetrics: Record<string, SubcomponentMetrics>;
  setModalMetrics: Dispatch<SetStateAction<Record<string, SubcomponentMetrics>>>;
  modalNonRD: number;
  setModalNonRD: (value: number) => void;
  enabledSteps: Record<string, boolean>;
  setEnabledSteps: (steps: Record<string, boolean>) => void;
  customStepTimes: Record<string, number>;
  setCustomStepTimes: Dispatch<SetStateAction<Record<string, number>>>;
  lockedSteps: Record<string, boolean>;
  setLockedSteps: (steps: Record<string, boolean>) => void;
  openStep: string | null;
  setOpenStep: (step: string | null) => void;
  currentYear: number;
}

export function SubcomponentWizard({
  open,
  onClose,
  onSave,
  initialData,
  modalHierarchyState
}: WizardProps) {
  const [step, setStep] = useState<typeof WIZARD_STEPS[keyof typeof WIZARD_STEPS]>(WIZARD_STEPS.SELECTION);
  const [errors, setErrors] = useState<string[]>([]);
  const {
    selectedModalSubs,
    setSelectedModalSubs,
    modalMetrics,
    setModalMetrics,
    modalNonRD,
    setModalNonRD,
    enabledSteps,
    setEnabledSteps,
    customStepTimes,
    setCustomStepTimes,
    lockedSteps,
    setLockedSteps,
    openStep,
    setOpenStep,
    resetState
  } = useWizardState({ activity: '', csvRows: [] });

  // LocalStorage persistence
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem('qraWizardState');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.selectedModalSubs) setSelectedModalSubs(state.selectedModalSubs);
        if (state.modalMetrics) setModalMetrics(state.modalMetrics);
        if (state.modalNonRD) setModalNonRD(state.modalNonRD);
        if (state.customStepTimes) setCustomStepTimes(state.customStepTimes);
        if (state.lockedSteps) setLockedSteps(state.lockedSteps);
      }
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      localStorage.setItem('qraWizardState', JSON.stringify({
        selectedModalSubs,
        modalMetrics,
        modalNonRD,
        customStepTimes,
        lockedSteps
      }));
    }
  }, [open, selectedModalSubs, modalMetrics, modalNonRD, customStepTimes, lockedSteps]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleComplete = () => {
    onSave({
      selectedSubs: selectedModalSubs,
      metrics: modalMetrics,
      nonRD: modalNonRD,
      customStepTimes,
      lockedSteps
    });
    localStorage.removeItem('qraWizardState');
    handleClose();
  };

  const handleNext = () => {
    // Validate current state
    const selectionValidation = validateSelections(selectedModalSubs, modalMetrics);
    const timeValidation = validateStepTimes(customStepTimes, selectedModalSubs);
    const nonRDValidation = validateNonRDTime(modalNonRD);

    const allErrors = [
      ...selectionValidation.errors,
      ...timeValidation.errors,
      ...nonRDValidation.errors
    ];

    if (allErrors.length > 0) {
      setErrors(allErrors);
      return;
    }

    setErrors([]);
    setStep(WIZARD_STEPS.REVIEW);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: UI.DIALOG.MIN_HEIGHT,
          maxHeight: UI.DIALOG.MAX_HEIGHT
        }
      }}
    >
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Subcomponent Selection
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Step {step} of 2
          </Typography>
        </Toolbar>
      </AppBar>

      <DialogContent>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {step === WIZARD_STEPS.SELECTION ? (
          <StepOne
            activity={''}
            modalHierarchyState={modalHierarchyState}
            selectedModalSubs={selectedModalSubs}
            setSelectedModalSubs={setSelectedModalSubs}
            modalMetrics={modalMetrics}
            setModalMetrics={setModalMetrics}
            modalNonRD={modalNonRD}
            setModalNonRD={setModalNonRD}
            enabledSteps={enabledSteps}
            setEnabledSteps={(steps) => {}}
            lockedSteps={lockedSteps}
            setLockedSteps={setLockedSteps}
            customStepTimes={customStepTimes}
            setCustomStepTimes={setCustomStepTimes}
            openStep={openStep}
            setOpenStep={setOpenStep}
            currentYear={0}
          />
        ) : (
          <StepTwo
            selectedModalSubs={selectedModalSubs}
            modalMetrics={modalMetrics}
            modalNonRD={modalNonRD}
            customStepTimes={customStepTimes}
            currentYear={0}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {step === WIZARD_STEPS.SELECTION ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={Object.keys(selectedModalSubs).length === 0}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleComplete}
          >
            Complete
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 