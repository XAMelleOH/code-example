import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalsAndTasksSetUpComponent } from './goals-and-tasks-set-up.component';
import { TranslateModule } from '@ngx-translate/core';
import { AccordionModule, CheckboxModule } from 'primeng/primeng';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

const GOALS = [
  {
    tag: 'GOAL_1', text: 'GOAL_1',
    tasks: [
      { text: 'TEST_1', tag: 'TEST_1', isSelected: true, availableForCoPa: true },
      { text: 'TEST_2', tag: 'TEST_2', isSelected: false, availableForCoPa: false },
    ],
  },
  {
    tag: 'GOAL_2', text: 'GOAL_2',
    tasks: [
      { text: 'TEST_3', tag: 'TEST_3', isSelected: false, availableForCoPa: false },
      { text: 'TEST_4', tag: 'TEST_4', isSelected: true, availableForCoPa: false },
    ],
  },
];


describe('GoalsAndTasksSetUpComponent', () => {
  let component: GoalsAndTasksSetUpComponent;
  let fixture: ComponentFixture<GoalsAndTasksSetUpComponent>;

  beforeEach(async(() => {
    TestBed
      .configureTestingModule({
        imports: [NoopAnimationsModule, TranslateModule.forRoot({}), AccordionModule, CheckboxModule, FormsModule, ReactiveFormsModule],
        declarations: [GoalsAndTasksSetUpComponent],
      })
      .overrideComponent(GoalsAndTasksSetUpComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalsAndTasksSetUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    component = null;
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show all available tasks if no copa was choosen', function() {
    component.goals = [...GOALS];
    (component as any).setup();
    fixture.detectChanges();

    expect(
      fixture.debugElement.queryAll(By.css('[data-cy=checkboxWrapper]')),
    ).toHaveLength(4);
  });

  it('should show all goals tabs', function() {
    component.withCopa = false;
    component.goals = [...GOALS];
    (component as any).setup();
    fixture.detectChanges();

    expect(
      fixture.debugElement.queryAll(By.css('[data-test="goal-accordion"]')),
    ).toHaveLength(2);
  });

  it('should show CoPa tasks only if copa was chosen', function() {
    component.withCopa = true;
    component.goals = [...GOALS];
    (component as any).setup();
    fixture.detectChanges();

    expect(
      fixture.debugElement.queryAll(By.css('[data-cy=checkboxWrapper]')),
    ).toHaveLength(1);
  });


  it('should filter out goals without CoPa tasks if copa was chosen', function() {
    component.withCopa = true;
    component.goals = [...GOALS];
    (component as any).setup();
    fixture.detectChanges();

    expect(
      fixture.debugElement.queryAll(By.css('[data-cy=checkboxWrapper]')),
    ).toHaveLength(1);
  });

  it('should check isSelected items', async(() => {
    component.goals = [...GOALS];
    (component as any).setup();

    fixture.detectChanges();

    expect(
      fixture.debugElement.queryAll(By.css('[data-cy=checkboxWrapper] [type=checkbox]:checked')),
    ).toHaveLength(2);
  }));

  it('should trigger checked$ on form change', function() {
    jest.spyOn(component.checked$, 'emit');

    component.goals = [ ...GOALS ];
    (component as any).setup();
    component.form.get('TEST_2').setValue(true);

    expect(component.checked$.emit).toHaveBeenCalledWith(['TEST_1', 'TEST_2', 'TEST_4']);
  });

  it('should trigger isSelected items on form init', function() {
    jest.spyOn(component.checked$, 'emit');

    component.goals = [...GOALS];
    (component as any).setup();

    expect(component.checked$.emit).toHaveBeenCalledWith(['TEST_1', 'TEST_4']);
  });

  describe('getCopaGoals', () => {
    it('should filter out not available tasks for CoPa', function() {
      component.goals = [...GOALS];
      expect(
        component.getCopaGoals(),
      ).toEqual(
        [
          {
            tag: 'GOAL_1', text: 'GOAL_1',
            tasks: [
              { text: 'TEST_1', tag: 'TEST_1', isSelected: true, availableForCoPa: true },
            ],
          },
        ],
      );
    });
  });
});
