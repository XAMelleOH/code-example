import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GoalsAndTasksService } from '../../../services/goals-and-tasks/goals-and-tasks.service';
import { goalsAndTasksServiceStub } from '../../../stubs/goals-and-tasks.service.stub';
import { GoalsAndTasksListComponent } from './goals-and-tasks-list/goals-and-tasks-list.component';
import { GoalsAndTasksSetUpComponent } from './goals-and-tasks-set-up/goals-and-tasks-set-up.component';
import { LocalizeDatePipe } from '@hearingapps/shared/pipes';
import { TranslateModule } from '@ngx-translate/core';
import { AccordionModule, CheckboxModule, TabViewModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';

import { GoalsAndTasksComponent } from './goals-and-tasks.component';
import { By } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { APP_ENVIRONMENT } from '@hearingapps/shared/configs';
import { cold, hot } from 'jest-marbles';
import { MockComponent } from 'ng-mocks';
import { RemoveTaskConfirmPopupComponent } from '../../popups/remove-task-confirm-popup/remove-task-confirm-popup.component';
import { PreselectedTasksPopupComponent } from '../../popups/preselected-tasks-popup/preselected-tasks-popup.component';
import { GoalsAndTasksPopupComponent } from '../../popups/goals-and-tasks-popup/goals-and-tasks-popup.component';
import { CopaOnboardingPopupComponent } from '../../popups/copa-onboarding-popup/copa-onboarding-popup.component';
import { GoalsAndTasksProgramInfoComponent } from '../../hearingdiary-client-detail/goals-and-tasks/goals-and-tasks-program-info/goals-and-tasks-program-info.component';
import { GoalsAndTasksRatingComponent } from '../../hearingdiary-client-detail/goals-and-tasks/goals-and-tasks-rating/goals-and-tasks-rating.component';

describe('GoalsAndTasksComponent', () => {
  let component: GoalsAndTasksComponent;
  let fixture: ComponentFixture<GoalsAndTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TranslateModule.forRoot({}),
        TableModule,
        TabViewModule,
        AccordionModule,
        CheckboxModule,
        ReactiveFormsModule,
      ],
      declarations: [
        GoalsAndTasksComponent,
        LocalizeDatePipe,
        MockComponent(GoalsAndTasksListComponent),
        MockComponent(GoalsAndTasksSetUpComponent),
        MockComponent(RemoveTaskConfirmPopupComponent),
        MockComponent(PreselectedTasksPopupComponent),
        MockComponent(GoalsAndTasksPopupComponent),
        MockComponent(CopaOnboardingPopupComponent),
        MockComponent(GoalsAndTasksProgramInfoComponent),
        MockComponent(GoalsAndTasksRatingComponent),
      ],
      providers: [
        { provide: GoalsAndTasksService, useValue: goalsAndTasksServiceStub },
        { provide: APP_ENVIRONMENT, useValue: { hearingDiaryOptions: { copaEnabled: true } } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalsAndTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clear CoPa info before add task popup open', function() {
    component.copaInfo = {} as any;
    component.showAddTaskPopup();

    expect(component.copaInfo).toBeNull();
  });

  it('should clear CoPa info before copa onboard popup open', function() {
    component.copaInfo = {} as any;
    component.startDefiningTasks();

    expect(component.copaInfo).toBeNull();
  });

  it('should save copa info after copa onboard popup close', function() {
    const formData = {};
    component.copaInfo = null;
    component.showGoalsAndTasks(formData as any);

    expect(component.copaInfo).toBe(formData);
  });

  it('should show task customization popup', async(function() {
    component.showTaskCustomizationPopup();
    fixture.detectChanges();

    expect(component.isShowOnBoardingPopup).toBeFalsy();
    expect(component.isShowPreselectedTasksPopup).toBeFalsy();
    expect(component.isShowAddTaskPopup).toBeTruthy();

    expect(fixture).toMatchSnapshot();
  }));

  it('should open CoPa popup', async(function() {
    fixture.debugElement.query(By.css('[data-test="goat__expand--btn"]')).nativeElement.click();
    component.explorationPeriod$.next({ explorationPeriodId: null });
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-test="showAddTaskPopupButton"]')).nativeElement.click();
    fixture.detectChanges();

    expect(component.copaInfo).toBeNull();
    expect(component.isShowOnBoardingPopup).toBeTruthy();
    expect(component.isShowPreselectedTasksPopup).toBeFalsy();

    expect(fixture.debugElement.queryAll(By.directive(CopaOnboardingPopupComponent))).toHaveLength(1);
  }));

  describe('goalsWithPreselection$', function() {
    it('should get all tasks not selected if not preselection were passed', function() {
      const goatService = fixture.debugElement.injector.get(GoalsAndTasksService);
      const goals = [
        { tag: 'GOAL_1', text: 'GOAL', tasks: [{ tag: 'TASK_1' }] },
        { tag: 'GOAL_2', text: 'GOAL 2', tasks: [{ tag: 'TASK_3' }] },
      ];
      jest.spyOn(goatService, 'fetchTasks').mockReturnValue(hot('-a-|', { a: goals }));
      jest.spyOn(goatService, 'fetchPreselectedTasks').mockReturnValue(hot('-a-|', { a: [] }));

      component.ngOnInit();

      expect(component.goalsWithPreselection$).toBeObservable(
        cold('-a-|', {
          a: [
            { tag: 'GOAL_1', text: 'GOAL', tasks: [{ tag: 'TASK_1', isSelected: false }] },
            { tag: 'GOAL_2', text: 'GOAL 2', tasks: [{ tag: 'TASK_3', isSelected: false }] },
          ],
        })
      );
    });

    it('should set tasks selection from predefined response', function() {
      const goatService = fixture.debugElement.injector.get(GoalsAndTasksService);
      const goals = [
        { tag: 'GOAL_1', text: 'GOAL', tasks: [{ tag: 'TASK_1' }, { tag: 'TASK_2' }] },
        { tag: 'GOAL_2', text: 'GOAL 2', tasks: [{ tag: 'TASK_3' }, { tag: 'TASK_4' }] },
      ];
      jest.spyOn(goatService, 'fetchTasks').mockReturnValue(hot('-a-|', { a: goals }));
      jest
        .spyOn(goatService, 'fetchPreselectedTasks')
        .mockReturnValue(hot('---a-|', { a: [{ tag: 'TASK_4' }, { tag: 'TASK_1' }] }));

      component.ngOnInit();

      expect(component.goalsWithPreselection$).toBeObservable(
        cold('---a-|', {
          a: [
            {
              tag: 'GOAL_1',
              text: 'GOAL',
              tasks: [{ tag: 'TASK_1', isSelected: true }, { tag: 'TASK_2', isSelected: false }],
            },
            {
              tag: 'GOAL_2',
              text: 'GOAL 2',
              tasks: [{ tag: 'TASK_3', isSelected: false }, { tag: 'TASK_4', isSelected: true }],
            },
          ],
        })
      );
    });
  });

  describe('CoPa env variable disabled', function() {
    beforeEach(async(() => {
      fixture.debugElement.injector.get(APP_ENVIRONMENT).hearingDiaryOptions.copaEnabled = false;
    }));

    it('should skip CoPa popup', async(function() {
      component.copaInfo = {} as any;
      fixture.debugElement.query(By.css('[data-test="goat__expand--btn"]')).nativeElement.click();
      fixture.detectChanges();

      component.explorationPeriod$.next({ explorationPeriodId: null });
      fixture.detectChanges();

      fixture.debugElement.query(By.css('[data-test="showAddTaskPopupButton"]')).nativeElement.click();
      fixture.detectChanges();

      expect(component.copaInfo).toBeNull();
      expect(component.isShowOnBoardingPopup).toBeFalsy();
      expect(component.isShowPreselectedTasksPopup).toBeTruthy();

      expect(fixture.debugElement.queryAll(By.directive(PreselectedTasksPopupComponent))).toHaveLength(1);
    }));
  });
});
