import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { toFormGroup } from '@hearingapps/shared/helpers';
import { map } from 'rxjs/operators';
import { Goal, Task } from '../goals-and-tasks.component';
import { Subscription } from 'rxjs';

export interface IControl {
  value: string;
  title: string;
  type: string;
  goalTag: string;
}

@Component({
  selector: 'hearingapps-goals-and-tasks-set-up',
  templateUrl: './goals-and-tasks-set-up.component.html',
  styleUrls: ['./goals-and-tasks-set-up.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalsAndTasksSetUpComponent implements OnChanges, OnDestroy {
  @Input() public goals: Goal[];
  @Input() public withCopa: boolean;

  @Output() public checked$ = new EventEmitter<string[]>();

  public form: FormGroup;
  public controls: IControl[] = [];

  public currentGoals: Goal[] = [];

  private formValueChangesSubscription: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['goals'].currentValue) {
      this.setup();
    }
  }

  ngOnDestroy(): void {
    if (this.formValueChangesSubscription) {
      this.formValueChangesSubscription.unsubscribe();
    }
  }

  public getCopaGoals(): Goal[] {
    const result = [];

    for (const goal of this.goals) {
      const tasks = goal.tasks.filter(task => task.availableForCoPa === true);
      if (tasks.length > 0) {
        result.push({ ...goal, tasks: tasks });
      }
    }

    return result;
  }

  private setup(): void {
    const defaults = {};
    this.goals.forEach(({ tasks, tag: goalTag }: Goal) => {
      if (!(tasks.length > 0)) {
        return;
      }

      tasks.forEach(({ text: title, tag: value, isSelected }: Task) => {
        this.controls.push({ title, value, type: 'checkbox', goalTag });
        defaults[value] = isSelected;
      });
    });

    this.form = toFormGroup(this.controls, defaults);
    this.onChanges();

    this.form.updateValueAndValidity({ emitEvent: true });

    this.currentGoals = (this.withCopa ? this.getCopaGoals() : this.goals);
  }

  private onChanges(): void {
    this.formValueChangesSubscription = this.form.valueChanges.pipe(
      map(form => Object.entries(form).filter(([_, state]) => Boolean(state))),
      map((form: [string, boolean][]) => form.map(([key, _]) => key)),
    ).subscribe((tags: string[]) => this.checked$.emit(tags));
  }

}
