import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import {
  CommunicationPartnerDetails,
  ExplorationPeriodOverview,
  ExplorationTask,
  HcpGoal,
  HcpPreselectedTask,
  HcpTask,
  RelationshipDetails,
} from '../../../apiclient';
import { GoalModel } from '../../../models/goal.model';
import { GoalsAndTasksService } from '../../../services/goals-and-tasks/goals-and-tasks.service';
import { APP_ENVIRONMENT } from '@hearingapps/shared/configs';
import { HearingDiaryEnvironment } from '@hearingapps/shared/models';

export interface Task extends HcpTask {
  isSelected: boolean;
}

export interface Goal extends HcpGoal {
  tasks: Array<Task>;
}

@Component({
  selector: 'hearingapps-goals-and-tasks',
  templateUrl: './goals-and-tasks.component.html',
  styleUrls: ['./goals-and-tasks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalsAndTasksComponent implements OnInit {
  @Input() relationshipId: string = null;
  @Input() client: RelationshipDetails = null;

  public explorationPeriod$ = new BehaviorSubject<ExplorationPeriodOverview>({});
  public goals$: Observable<HcpGoal[]>;
  public goalsWithPreselection$: Observable<Goal[]>;
  public assignedGoals$: Observable<ExplorationTask[]>;
  public preselectedTasks$: Observable<HcpPreselectedTask[]>;
  public tmpMarkedForRemoveTaskId: string;
  public setOfAssignedTasks: Set<string>;

  public isExpandedList: boolean;
  public isShowAddTaskPopup: boolean = false;
  public isShowPreselectedTasksPopup: boolean = false;
  public isShowOnBoardingPopup: boolean = false;
  public isShowRemoveConfirmationPopup: boolean = false;
  public copaInfo: CommunicationPartnerDetails;

  public get explorationPeriodId(): string {
    const { value: { explorationPeriodId } } = this.explorationPeriod$;

    return explorationPeriodId;
  }

  constructor(
    private service: GoalsAndTasksService,
    private cd: ChangeDetectorRef,
    @Inject(APP_ENVIRONMENT) readonly appEnvironment: HearingDiaryEnvironment,
  ) {
  }

  ngOnInit() {
    this.loadExplorationPeriod();

    this.goals$ = this.service.fetchTasks().pipe(
      map((goals: HcpGoal[]) => this.explorationPeriodId
        ? GoalModel.applyFilters(goals, this.setOfAssignedTasks)
        : goals,
      ),
    );

    this.assignedGoals$ = this.explorationPeriod$.pipe(
      filter((period: ExplorationPeriodOverview) => !isEmpty(period)),
      switchMap(({ explorationPeriodId }: ExplorationPeriodOverview) =>
        this.getAssignedGoals(explorationPeriodId),
      ),
    );

    this.preselectedTasks$ = this.service.fetchPreselectedTasks().pipe(shareReplay());

    this.goalsWithPreselection$ = combineLatest([this.preselectedTasks$, this.goals$])
      .pipe(map(([preselection, goals]: [HcpPreselectedTask[], Goal[]]) => {
        goals.forEach((goal: Goal) => {
          goal.tasks.forEach((task) => {
            task.isSelected = !!preselection.find(pre => pre.tag === task.tag);
          });
        });
        return goals;
      }));
  }

  public loadExplorationPeriod(): void {
    this.service.fetchExplorationPeriods(this.relationshipId).pipe(
      take(1),
      map((periods: ExplorationPeriodOverview[]) => periods[0] || {}),
    ).subscribe((period: ExplorationPeriodOverview) => this.explorationPeriod$.next(period));
  }

  public getAssignedGoals(explorationPeriodId: string): Observable<ExplorationTask[]> {
    return this.service.fetchExplorationPeriodStatusWithTasks(this.relationshipId, explorationPeriodId).pipe(
      tap((tasks: ExplorationTask[]) => {
        this.setOfAssignedTasks = new Set<string>(tasks.map(({ tag }: ExplorationTask) => tag));
      }),
    );
  }

  public savePreselectedTasks(): void {
    this.service.savePreselectedTasksWithCopa(this.relationshipId, this.copaInfo).subscribe(() => {
      this.loadExplorationPeriod();
      this.cd.detectChanges();
    });

    this.isShowPreselectedTasksPopup = false;
  }

  public saveTasks(tags: string[]): void {
    this.service.saveTasks(this.relationshipId, tags, this.copaInfo).subscribe(
      () => {
        this.loadExplorationPeriod();
        this.cd.detectChanges();
      },
    );
  }

  public addTasks(tasksTags: string[]): void {
    this.service.addTasksToExistingExplorationPeriod(
      this.relationshipId, this.explorationPeriodId, tasksTags,
    ).subscribe(() => this.loadExplorationPeriod());
  }

  public removeTask(): void {
    const { value: { explorationPeriodId } } = this.explorationPeriod$;
    this.service.removeExplorationPeriodTask(
      this.relationshipId, explorationPeriodId, this.tmpMarkedForRemoveTaskId,
    ).subscribe(() => this.loadExplorationPeriod());

    this.tmpMarkedForRemoveTaskId = null;
  }

  public beforeRemoveTaskHandler(id: string): void {
    this.isShowRemoveConfirmationPopup = true;
    this.tmpMarkedForRemoveTaskId = id;
  }

  public onCancelRemove(): void {
    this.isShowRemoveConfirmationPopup = false;
    this.tmpMarkedForRemoveTaskId = null;
  }

  public showAddTaskPopup(): void {
    this.copaInfo = null;
    this.isShowAddTaskPopup = true;
  }

  public startDefiningTasks() {
    if (this.appEnvironment.hearingDiaryOptions.copaEnabled) {
      this.copaInfo = null;
      this.isShowOnBoardingPopup = true;
    } else {
      this.copaInfo = null;
      this.isShowPreselectedTasksPopup = true;
    }
  }

  public getFullName(client): string {
    return client ? (client.firstName + ' ' + client.lastName) : null;
  }

  public showGoalsAndTasks(details: CommunicationPartnerDetails) {
    this.copaInfo = null;
    this.isShowOnBoardingPopup = false;
    this.isShowPreselectedTasksPopup = true;

    this.copaInfo = details;
  }

  public showTaskCustomizationPopup() {
    this.isShowOnBoardingPopup = false;
    this.isShowPreselectedTasksPopup = false;
    this.isShowAddTaskPopup = true;
  }
}
